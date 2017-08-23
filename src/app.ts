require("./extensions.js");
import fs = require("fs");
import YAML = require('yamljs');
import mkdirp = require('mkdirp');
import path = require('path');
import util = require('util');
import { KSLangSchema as ks } from "./KSLangSchema";
import { TypeScriptParser } from "./TypeScriptParser";
import { Template } from "./TemplateCompiler";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";

namespace KsLangSchema {
    export interface FunctionArgument {
        name: string;
    }

    export interface Function {
        arguments: FunctionArgument[];
        includes: string[];
        template: string;
    }

    export enum Casing {
        PascalCase = "pascal_case",
        CamelCase = "camel_case",
        SnakeCase = "snake_case",
    }

    export interface CasingOptions {
        class?: Casing;
        method?: Casing;
    }

    export interface TemplateObj {
        args: FunctionArgument[];
        template: string;
    }

    export interface Templates {
        testGenerator: string;
        main: string;
        [name: string]: string|TemplateObj;
    }

    export interface LangFile {
        functions: { [name: string]: Function };
        extension: string;
        casing: CasingOptions;
        primitiveTypes: {
            void: string;
            boolean: string;
            string: string;
            int32: string;
        };
        array: string;
        templates: Templates;
        expressions: string;
    }
}

const prgName = "Test";
const sourceCode = fs.readFileSync(`input/${prgName}.ts`, "utf8");
const schema = TypeScriptParser.parseFile(sourceCode);
const schemaJson = JSON.stringify(schema, null, 4);
//console.log(schemaJson);
fs.writeFileSync("schema.json", schemaJson);

namespace CodeGeneratorSchema {
    export interface MethodParameter {
        idx: number;
        name: string;
        type: string;
    }

    export interface Method {
        parameters: MethodParameter[];
        name: string;
        returnType: string;
        visibility: "public"|"protected"|"private";
    }

    export interface Class {
        name: string;
        publicMethods: Method[];
        privateMethods: Method[];
    }

    export interface Root {
        absoluteIncludes: string[];
        classes: Class[];
        main?: () => string;
    }
}

class CodeGenerator {
    constructor(public schema: ks.SchemaFile, public lang: KsLangSchema.LangFile) { }

    getName(name: string, type: "class"|"method"|"enum") {
        const casing = this.lang.casing[type === "enum" ? "class" : type];
        const parts = name.split("_").map(x => x.toLowerCase());
        if (casing === KsLangSchema.Casing.CamelCase)
            return parts[0] + parts.splice(1).map(x => x.ucFirst()).join("");
        else if (casing === KsLangSchema.Casing.PascalCase)
            return parts.map(x => x.ucFirst()).join("");
        else if (casing === KsLangSchema.Casing.SnakeCase)
            return parts.join("_");
        else
            throw new Error(`Unknown casing: ${casing}`);
    }

    getTypeName(type: ks.Type) {
        if (type.type === ks.PrimitiveType.Array)
            return (this.lang.array || "{{type}}[]").replace("{{type}}", this.getTypeName(type.typeArguments[0]));
        else if (type.type === ks.PrimitiveType.Class)
            return this.getName(type.className, "class");
        else
            return this.lang.primitiveTypes ? this.lang.primitiveTypes[type.type] : type.type;
    }

    convertIdentifier(origName: string, vars: string[], mode: "variable"|"field"|"declaration") {
        const name = origName === "class" ? "cls" : origName;
        const isLocalVar = vars.includes(name);
        return `${isLocalVar || mode === "declaration" || mode === "field" ? "" : "this."}${name}`;
    }

    getMethodPath(method: ks.Expression) {
        let parts = [];
        let currExpr = method;
        while (true) {
            if (currExpr.type === ks.ExpressionType.PropertyAccess) {
                const propAcc = <ks.PropertyAccessExpression> currExpr;
                if (propAcc.propertyName.type !== ks.ExpressionType.Identifier)
                    return null;

                parts.push((<ks.Identifier> propAcc.propertyName).text);
                currExpr = propAcc.object;
            } else if (currExpr.type === ks.ExpressionType.Identifier) {
                parts.push((<ks.Identifier> currExpr).text);
                break;
            } else
                return null;
        }

        const funcName = parts.reverse().map(x => x.toLowerCase()).join(".");
        return funcName;
    }

    generate() {
        const schema = <ks.SchemaFile>JSON.parse(JSON.stringify(this.schema));
        for (const enumName of Object.keys(schema.enums))
            schema.enums[enumName].name = this.getName(enumName, "enum");

        for (const className of Object.keys(schema.classes)) {
            const cls = schema.classes[className];
            cls.name = this.getName(className, "class");

            for (const methodName of Object.keys(cls.methods)) {
                const method = cls.methods[methodName];
                method.name = this.getName(methodName, "method");
            }
        }

        const self = this;
        const vm = { // <CodeGeneratorSchema.Root> 
            absoluteIncludes: [],
            classes: Object.keys(schema.classes).map(className => {
                const cls = schema.classes[className];
                const methods = Object.keys(cls.methods).map(methodName => {
                    const method = cls.methods[methodName];
                    return <CodeGeneratorSchema.Method> {
                        name: this.getName(methodName, "method"),
                        returnType: this.getTypeName(method.returns),
                        body: method.body,
                        parameters: method.parameters.map((param, idx) => {
                            return <CodeGeneratorSchema.MethodParameter> {
                                idx,
                                name: param.name,
                                type: this.getTypeName(param.type),
                            };
                        }),
                        visibility: "public" // TODO
                    };
                });
                return <CodeGeneratorSchema.Class> {
                    name: this.getName(className, "class"),
                    methods: methods,
                    publicMethods: methods,
                    privateMethods: []
                };
            }),
            expressionGenerators: <{ [name: string]: (expr: any) => string }> {},
            internalMethodGenerators: <{ [name: string]: (expr: any) => string }> {},
            gen: function (obj: ks.Statement|ks.Expression) {
                if (obj.type === ks.StatementType.Expression)
                    obj = (<ks.ExpressionStatement>obj).expression;

                if (obj.type === ks.ExpressionType.Call) {
                    const callExpr = <ks.CallExpression> obj;
                    const methodPath = self.getMethodPath(callExpr.method);
                    const method = methodPath && self.lang.functions[methodPath];
                    if (method) {
                        if (method.arguments.length !== callExpr.arguments.length)
                            throw new Error(`Invalid argument count for '${methodPath}': expected: ${method.arguments.length}, actual: ${callExpr.arguments.length}.`);

                        const args = callExpr.arguments.map(x => this.gen(x));
                        const code = this.internalMethodGenerators[methodPath].apply(this, args);
                        return code;
                    }
                }

                const genFunc = this.expressionGenerators[obj.type];
                if (!genFunc)
                    throw new Error(`Expression template not found: ${obj.type}!`);
                const result = genFunc.call(this, obj);

                console.log("generate statement", obj, result);

                return result;
            },
            main: <() => string> null,
        };

        for (const exprName of Object.keys(this.lang.expressions)) {
            const exprTmpl = this.lang.expressions[exprName];
            const tmpl = new Template(exprTmpl, ["expr"]);
            tmpl.convertIdentifier = this.convertIdentifier;
            const genFunc = tmpl.getGeneratorFunction();
            vm.expressionGenerators[exprName.ucFirst()] = genFunc;
        }

        for (const funcPath of Object.keys(this.lang.functions)) {
            const funcInfo = this.lang.functions[funcPath];
            const tmpl = new Template(funcInfo.template, funcInfo.arguments.map(x => x.name));
            tmpl.convertIdentifier = this.convertIdentifier;
            const genFunc = tmpl.getGeneratorFunction();
            vm.internalMethodGenerators[funcPath] = genFunc;
        }

        for (const tmplName of Object.keys(this.lang.templates)) {
            const tmplOrig = this.lang.templates[tmplName];
            const tmplObj = typeof tmplOrig === "string" ? <KsLangSchema.TemplateObj>{ template: tmplOrig, args: [] } : tmplOrig;
            if (tmplName === "testGenerator")
                tmplObj.args = [{ name: "cls" }, { name: "method" }];
            const tmpl = new Template(tmplObj.template, tmplObj.args.map(x => x.name));
            tmpl.convertIdentifier = this.convertIdentifier;
            const genFunc = tmpl.getGeneratorFunction();
            vm[tmplName] = genFunc;
        }

        const code = vm.main();

        return code;
    }
}

class Utils {
    static writeFile(fn: string, data: any) {
        mkdirp.sync(path.dirname(fn));
        fs.writeFileSync(fn, data);
    }
}

let langs = fs.readdirSync("langs");
langs = ["csharp.yaml"];
for (const langFn of langs) {
    const langName = langFn.replace(".yaml", "");
    const langSchema = <KsLangSchema.LangFile> YAML.parse(fs.readFileSync(`langs/${langFn}`, "utf8"));
    const codeGenerator = new CodeGenerator(schema, langSchema);
    const generatedCode = codeGenerator.generate();
    Utils.writeFile(`SamplePrograms/${prgName}/${prgName}.${langSchema.extension}`, generatedCode);
    console.log(generatedCode);
}
debugger;
