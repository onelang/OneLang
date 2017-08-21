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
        templates: Templates;
    }
}

const prgName = "Test";
const sourceCode = fs.readFileSync(`input/${prgName}.ts`, "utf8");
const schema = TypeScriptParser.parseFile(sourceCode);
const schemaJson = JSON.stringify(schema, null, 4);
console.log(schemaJson);
fs.writeFileSync("schema.json", schemaJson);

namespace CodeGeneratorSchema {
    export interface Statement {
    }

    export interface MethodBody {
        statements: Statement[];
    }

    export interface Method {
        name: string;
        returnType: string;
        body: MethodBody;
    }

    export interface Class {
        name: string;
        publicMethods: Method[];
        privateMethods: Method[];
    }

    export interface Root {
        absoluteIncludes: string[];
        classes: Class[];
    }
}

class CodeGenerator {
    constructor(public schema: ks.SchemaFile, public lang: KsLangSchema.LangFile) { }

    generate() {
        const vm = <CodeGeneratorSchema.Root> {
            absoluteIncludes: [],
            classes: Object.keys(this.schema.classes).map(className => {
                return <CodeGeneratorSchema.Class> {
                    name: className,
                    publicMethods: [],
                    privateMethods: []
                };
            }),
            main: () => { return ""; }
        };

        for (const tmplName of Object.keys(this.lang.templates)) {
            const tmplOrig = this.lang.templates[tmplName];
            const tmplObj = typeof tmplOrig === "string" ? <KsLangSchema.TemplateObj>{ template: tmplOrig, args: [] } : tmplOrig;
            if (tmplName === "testGenerator")
                tmplObj.args = [{ name: "cls" }, { name: "method" }];
            const tmpl = new Template(tmplObj.template, tmplObj.args.map(x => x.name));
            tmpl.convertIdentifier = (origName, vars, mode) => {
                console.log(origName, vars, mode);
                const name = origName === "class" ? "cls" : origName;
                const isLocalVar = vars.includes(name);
                return `${isLocalVar || mode === "declaration" || mode === "field" ? "" : "this."}${name}`;
            };
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

for (const langFn of fs.readdirSync("langs")) {
    const langName = langFn.replace(".yaml", "");
    const langSchema = <KsLangSchema.LangFile> YAML.parse(fs.readFileSync(`langs/${langFn}`, "utf8"));
    const codeGenerator = new CodeGenerator(schema, langSchema);
    const generatedCode = codeGenerator.generate();
    Utils.writeFile(`SamplePrograms/${prgName}/${prgName}.${langSchema.extension}`, generatedCode);
}

debugger;

