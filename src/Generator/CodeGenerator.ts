import { OneAst as one } from "../One/Ast";
import { Template } from "./TemplateCompiler";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";
import { TypeInferer } from "../One/TypeInferer";
import { OverviewGenerator } from "../One/OverviewGenerator";
import { LangFileSchema } from "./LangFileSchema";

export function deindent(str: string) {
    function getPadLen(line: string) {
        for (let i = 0; i < line.length; i++)
            if (line[i] !== ' ')
                return i;
        return -1; // whitespace line => pad === 0
    }

    const lines = str.split("\n");
    if (getPadLen(lines[0]) === -1)
        lines.shift();

    const minPadLen = Math.min.apply(null, lines.map(getPadLen).filter(x => x !== -1));
    const newStr = lines.map(x => x.length !== 0 ? x.substr(minPadLen) : x).join("\n");
    return newStr;
}

function tmpl(parts: TemplateStringsArray, ...values: any[]) {
    let result = parts[0];
    for (let i = 0; i < values.length; i++) {
        const prevLastLineIdx = result.lastIndexOf("\n");
        const extraPad = result.length - (prevLastLineIdx === -1 ? 0 : prevLastLineIdx + 1);
        result += values[i].toString().replace(/\n/g, "\n" + " ".repeat(extraPad)) + parts[i + 1];
    }
    return deindent(result);
}

namespace CodeGeneratorModel {
    export interface MethodParameter {
        idx: number;
        name: string;
        type: string;
    }

    export interface Method {
        visibility: "public"|"protected"|"private";
        name: string;
        parameters: MethodParameter[];
        returnType: string;
        body: one.Block;
    }

    export interface Class {
        name: string;
        methods: Method[];
        publicMethods: Method[];
        privateMethods: Method[];
    }
}

class CodeGeneratorModel {
    includes: string[] = [];
    absoluteIncludes: string[] = [];
    classes: CodeGeneratorModel.Class[] = [];
    expressionGenerators: { [name: string]: (expr: any) => string } = {};
    internalMethodGenerators: { [name: string]: (expr: any) => string } = {};

    constructor(public generator: CodeGenerator) { }
    
    gen(obj: one.Statement|one.Expression) {
        const type = (<one.Statement>obj).stmtType || (<one.Expression>obj).exprKind;
        if (type === one.StatementType.Expression)
            obj = (<one.ExpressionStatement>obj).expression;

        if (type === one.ExpressionKind.Call) {
            const callExpr = <one.CallExpression> obj;
            const methodPath = this.generator.getMethodPath(callExpr.method);
            const method = methodPath && this.generator.lang.functions[methodPath];
            if (method) {
                if (method.arguments.length !== callExpr.arguments.length)
                    throw new Error(`Invalid argument count for '${methodPath}': expected: ${method.arguments.length}, actual: ${callExpr.arguments.length}.`);

                const args = callExpr.arguments.map(x => this.gen(x));
                const code = this.internalMethodGenerators[methodPath].apply(this, args);
                return code;
            }
        }

        let genName = type.toString();
        if (genName === one.ExpressionKind.Literal) {
            const literalExpr = <one.Literal> obj;
            genName = `${literalExpr.literalType.ucFirst()}Literal`;
        }

        const genFunc = this.expressionGenerators[genName];
        if (!genFunc)
            throw new Error(`Expression template not found: ${genName}!`);
        const result = genFunc.call(this, obj);

        //console.log("generate statement", obj, result);

        return result;
    }

    main(): string { return null; }
    testGenerator(cls: string, method: string): string { return null; }
}

export class CodeGenerator {
    schema: one.Schema;
    model = new CodeGeneratorModel(this);
    templateObjectCode: string;
    templateObject;

    constructor(schema: one.Schema, public lang: LangFileSchema.LangFile) {
        this.schema = JSON.parse(JSON.stringify(schema)); // clone
        this.setupNames();
        this.setupClasses();
        this.setupIncludes();

        // TODO: use SchemaTransformer to infer types...
        //this.inferTypes();

        this.compileTemplates();
    }

    getName(name: string, type: "class"|"method"|"enum") {
        const casing = this.lang.casing[type === "enum" ? "class" : type];
        const parts = name.split("_").map(x => x.toLowerCase());
        if (casing === LangFileSchema.Casing.CamelCase)
            return parts[0] + parts.splice(1).map(x => x.ucFirst()).join("");
        else if (casing === LangFileSchema.Casing.PascalCase)
            return parts.map(x => x.ucFirst()).join("");
        else if (casing === LangFileSchema.Casing.SnakeCase)
            return parts.join("_");
        else
            throw new Error(`Unknown casing: ${casing}`);
    }

    getTypeName(type: one.IType) {
        if (type.typeKind === one.TypeKind.Class)
            return this.getName(type.className, "class");
        else
            return this.lang.primitiveTypes ? this.lang.primitiveTypes[type.typeKind] : type.typeKind;
    }

    convertIdentifier(origName: string, vars: string[], mode: "variable"|"field"|"declaration") {
        const name = origName === "class" ? "cls" : origName;
        const isLocalVar = vars.includes(name);
        return `${isLocalVar || mode === "declaration" || mode === "field" ? "" : "this."}${name}`;
    }

    getMethodPath(method: one.Expression) {
        let parts = [];
        let currExpr = method;
        while (true) {
            if (currExpr.exprKind === one.ExpressionKind.PropertyAccess) {
                const propAcc = <one.PropertyAccessExpression> currExpr;
                parts.push(propAcc.propertyName);
                currExpr = propAcc.object;
            } else if (currExpr.exprKind === one.ExpressionKind.Identifier) {
                parts.push((<one.Identifier> currExpr).text);
                break;
            } else
                return null;
        }

        const funcName = parts.reverse().map(x => x.toLowerCase()).join(".");
        return funcName;
    }

    genTemplate(template: string, args: string[]) {
        const tmpl = new Template(template, args);
        tmpl.convertIdentifier = this.convertIdentifier;
        return `return tmpl\`\n${tmpl.templateToJS(tmpl.treeRoot, args)}\`;`;
    }

    setupNames() {
        for (const enumName of Object.keys(this.schema.enums)) {
            const enumObj = this.schema.enums[enumName];
            enumObj.name = this.getName(enumName, "enum");
        }

        for (const className of Object.keys(this.schema.classes)) {
            const cls = this.schema.classes[className];
            cls.name = this.getName(className, "class");

            for (const methodName of Object.keys(cls.methods)) {
                const method = cls.methods[methodName];
                method.name = this.getName(methodName, "method");
            }
        }
    }

    setupClasses() {
        this.model.classes = Object.keys(this.schema.classes).map(className => {
            const cls = this.schema.classes[className];
            const methods = Object.keys(cls.methods).map(methodName => {
                const method = cls.methods[methodName];
                return <CodeGeneratorModel.Method> {
                    name: method.name,
                    returnType: this.getTypeName(method.returns),
                    body: method.body,
                    parameters: method.parameters.map((param, idx) => {
                        return <CodeGeneratorModel.MethodParameter> {
                            idx,
                            name: param.name,
                            type: this.getTypeName(param.type),
                        };
                    }),
                    visibility: "public" // TODO
                };
            });
            return <CodeGeneratorModel.Class> {
                name: cls.name,
                methods: methods,
                publicMethods: methods,
                privateMethods: []
            };
        });
    }

    setupIncludes() {
        for (const func of Object.values(this.lang.functions))
            for (const include of func.includes || [])
                this.model.includes.push(include);
    }

    genTemplateMethodCode(name: string, args: string[], template: string) {
        const newName = name.includes(".") ? `"${name}"` : name;
        return tmpl`
            ${newName}(${args.join(", ")}) {
                ${this.genTemplate(template, args)}
            },`;
    }

    compileTemplates() {
        this.templateObjectCode = tmpl`
            ({
                expressionGenerators: {
                    ${Object.keys(this.lang.expressions).map(name => 
                        this.genTemplateMethodCode(name.ucFirst(), ["expr"], this.lang.expressions[name])).join("\n\n")}
                },

                internalMethodGenerators: {
                    ${Object.keys(this.lang.functions).map(funcPath => {
                        const funcInfo = this.lang.functions[funcPath];
                        return this.genTemplateMethodCode(funcPath, funcInfo.arguments.map(x => x.name), funcInfo.template);
                    }).join("\n\n")}
                },

                ${Object.keys(this.lang.templates).map(tmplName => {
                    const tmplOrig = this.lang.templates[tmplName];
                    const tmplObj = typeof tmplOrig === "string" ? <LangFileSchema.TemplateObj>{ template: tmplOrig, args: [] } : tmplOrig;
                    if (tmplName === "testGenerator")
                        tmplObj.args = [{ name: "cls" }, { name: "method" }];
                    return this.genTemplateMethodCode(tmplName, tmplObj.args.map(x => x.name), tmplObj.template);
                }).join("\n\n")}
            })`;

        this.templateObject = eval(this.templateObjectCode);
    }

    generate(callTestMethod: boolean) {
        const model = Object.assign(this.model, this.templateObject);

        let code = this.model.main();
        if (callTestMethod)
            code += "\n\n" + this.model.testGenerator(this.getName("test_class", "class"), this.getName("test_method", "method"));

        return code;
    }
}

