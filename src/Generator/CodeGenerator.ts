import { OneAst as one } from "../One/Ast";
import { Template } from "./TemplateCompiler";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";
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

function tmpl(literalParts: TemplateStringsArray, ...values: any[]) {
    interface TemplatePart { type: "text"|"value", value: any, block?: boolean };
    let parts: TemplatePart[] = [];

    for (let i = 0; i < values.length + 1; i++) {
        parts.push({ type: "text", value: literalParts[i] });
        if (i < values.length) {
            let value = values[i];
            if (value instanceof tmpl.Block) {
                parts.push({ type: "value", value: value.data, block: true });
            } else {
                parts.push({ type: "value", value: value, block: false });
            }
        }
    }

    const isEmptyBlock = (part: TemplatePart) => part && part.block && part.value === "";

    // filter out whitespace text part if it's between two blocks from which one is empty
    //  (so the whitespace was there to separate blocks but there is no need for separator
    //  if the block is empty)
    parts = parts.filter((part, i) => 
        !(part.type === "text" && (isEmptyBlock(parts[i - 1]) || isEmptyBlock(parts[i + 1]))
            && /^\s*$/.test(part.value) ));

    let result = "";
    for (const part of parts) {
        if (part.type === "text") {
            result += part.value;
        } else if (part.type === "value") {
            const prevLastLineIdx = result.lastIndexOf("\n");
            const extraPad = result.length - (prevLastLineIdx === -1 ? 0 : prevLastLineIdx + 1);
            const value = (part.value||"").toString().replace(/\n/g, "\n" + " ".repeat(extraPad));
            result += value;
        }
    }
    return deindent(result);
}

namespace tmpl {
    export function Block(data: string) {
        if (!(this instanceof Block)) return new (<any>Block)(data);
        this.data = data;
    }
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

    log(data: string) { console.log(`[CodeGeneratorModel] ${data}`); }
    
    gen(obj: one.Statement|one.Expression) {
        const type = (<one.Statement>obj).stmtType || (<one.Expression>obj).exprKind;

        if (type === one.ExpressionKind.Call) {
            const callExpr = <one.CallExpression> obj;
            const methodRef = <one.MethodReference> callExpr.method;
            const metaPath = methodRef.methodRef.metaPath;
            const methodPath = metaPath && metaPath.replace(/\//g, ".");
            const method = this.generator.lang.functions[methodPath];
            if (method) {
                if (method.arguments.length !== callExpr.arguments.length)
                    throw new Error(`Invalid argument count for '${methodPath}': expected: ${method.arguments.length}, actual: ${callExpr.arguments.length}.`);

                const args = callExpr.arguments.map(x => this.gen(x));
                const thisArg = methodRef.thisExpr ? this.gen(methodRef.thisExpr) : null;
                const code = this.internalMethodGenerators[methodPath].apply(this, [thisArg].concat(args));
                return code;
            }
        } else if (type === one.ExpressionKind.VariableReference) {
            const varRef = <one.VariableRef> obj;
            if (varRef.varType === one.VariableRefType.InstanceField) {
                const varPath = `${varRef.thisExpr.valueType.className}.${varRef.varRef.name}`;
                const func = this.generator.lang.functions[varPath];
                const thisArg = varRef.thisExpr ? this.gen(varRef.thisExpr) : null;
                const gen = this.internalMethodGenerators[varPath];
                this.log(varPath);
                if (gen) {
                    const code = gen.apply(this, [thisArg]);
                    return code;
                }
            }
        }

        let genName = type.toString();
        if (genName === one.ExpressionKind.Literal) {
            const literalExpr = <one.Literal> obj;
            genName = `${literalExpr.literalType.ucFirst()}Literal`;
        } else if (genName === one.ExpressionKind.VariableReference) {
            const varRef = <one.VariableRef> obj;
            genName = `${varRef.varType}`;
        } else if (genName === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> obj;
            genName = methodRef.thisExpr ? "InstanceMethod" : "StaticMethod";
        } else if (genName === one.ExpressionKind.Unary) {
            const unaryExpr = <one.UnaryExpression> obj;
            genName = unaryExpr.unaryType.ucFirst();
        }

        if (type === one.ExpressionKind.ArrayLiteral) {
            const arrayLitExpr = <one.ArrayLiteral> obj;
            const oneArrType = arrayLitExpr.valueType.typeArguments[0].typeKind;
            const nativeArrType = this.generator.lang.primitiveTypes[oneArrType];
            arrayLitExpr.arrayType = nativeArrType;
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
        //this.schema = JSON.parse(JSON.stringify(schema)); // clone
        this.schema = schema;
        //this.setupNames();
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
        const tmplCodeLines = tmpl.templateToJS(tmpl.treeRoot, args).split("\n");
        const tmplCode = tmplCodeLines.length > 1 ? tmplCodeLines.map(x => `\n    ${x}`).join("") : tmplCodeLines[0];
        return `return tmpl\`${tmplCode}\`;`;
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
        this.model.classes = Object.values(this.schema.classes).map(cls => {
            const methods = Object.values(cls.methods).map(method => {
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
                    visibility: method.visibility || "public"
                };
            });

            const fields = Object.values(cls.fields).map(field => {
                return {
                    name: field.name,
                    type: this.getTypeName(field.type),
                    visibility: field.visibility || "public"
                }
            });

            return <CodeGeneratorModel.Class> {
                name: cls.name,
                methods: methods,
                publicMethods: methods.filter(x => x.visibility === "public"),
                protectedMethods: methods.filter(x => x.visibility === "protected"),
                privateMethods: methods.filter(x => x.visibility === "private"),
                fields: fields,
                publicFields: fields.filter(x => x.visibility === "public"),
                protectedFields: fields.filter(x => x.visibility === "protected"),
                privateFields: fields.filter(x => x.visibility === "private"),
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
                        const funcArgs = ["self"].concat((funcInfo.arguments||[]).map(x => x.name));
                        return this.genTemplateMethodCode(funcPath, funcArgs, funcInfo.template);
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

