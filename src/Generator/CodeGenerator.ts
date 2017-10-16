import { OneAst as one } from "../One/Ast";
import { Template } from "./TemplateCompiler";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";
import { OverviewGenerator } from "../One/OverviewGenerator";
import { LangFileSchema } from "./LangFileSchema";
import { deindent } from "./Utils";

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
            let extraPad = 0;
            while (result[prevLastLineIdx + 1 + extraPad] === " ")
                extraPad++;

            const value = (part.value||"").toString().replace(/\n/g, "\n" + " ".repeat(extraPad));
            //if (value.includes("Dictionary") || value.includes("std::map"))
            //    debugger;
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
        typeInfo: one.Type;
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
    operatorGenerators: { [name: string]: (left: one.Expression, right: one.Expression) => string } = {};
    expressionGenerators: { [name: string]: (expr: any, ...args: any[]) => string } = {};
    classGenerators: { 
        [className: string]: {
            typeGenerator: (expr: any, ...args: any[]) => string,
            methods: {
                [methodName: string]: (expr: any, ...args: any[]) => string
            },
            fields: {
                [fieldName: string]: (expr: any, ...args: any[]) => string
            }
        }
    } = {};

    constructor(public generator: CodeGenerator) { }

    log(data: string) { console.log(`[CodeGeneratorModel] ${data}`); }
    
    typeName(type: one.Type) {
        const cls = this.classGenerators[type.className];
        const result = cls ? cls.typeGenerator.apply(this, [null, type.typeArguments.map(x => this.typeName(x))]) : this.generator.getTypeName(type);
        return result;
    }

    isIfBlock(block: one.Block) {
        return block.statements && block.statements.length === 1
            && block.statements[0].stmtType === one.StatementType.If;
    }

    // TODO: hack: understand how perl works and fix this...
    hackPerlToVar(name: string) {
        return name.replace(/%|@/g, '$');
    }

    getOverlayCallCode(callExpr: one.CallExpression, extraArgs?: { [name: string]: any }) {
        const methodRef = <one.MethodReference> callExpr.method;
        
        // TODO: I should either use metaPath or methodRef/classRef everywhere, but not hacks like this
        let metaPath = methodRef.methodRef.metaPath;
        if (!metaPath) {
            if (methodRef.methodRef.classRef)
                metaPath = `${methodRef.methodRef.classRef.name}/${methodRef.methodRef.name}`;
            else {
                this.log("Meta path is missing!");
                return null;
            }
        }

        const metaPathParts = metaPath.split("/");
        const className = metaPathParts[0];
        const methodName = metaPathParts[1];
        const generatorName = `${className}.${methodName}`;

        const method = this.generator.lang.classes[className].methods[methodName];
        // if extraArgs was used then we only accept a method with extra args and vice versa
        if (!method || (!!method.extraArgs !== !!extraArgs)) return null;

        const extraArgValues = (method.extraArgs||[]).map(extraArgName => {
            if (!extraArgs.hasOwnProperty(extraArgName))
                throw new Error(`Extra argument '${extraArgName}' is missing!`);
            return extraArgs[extraArgName];
        });

        const stdMethod = this.generator.stdlib.classes[className].methods[methodName];
        const methodArgs = stdMethod.parameters.map(x => x.name);
        const exprCallArgs = callExpr.arguments.map(x => this.gen(x));

        if (methodArgs.length !== exprCallArgs.length)
            throw new Error(`Invalid argument count for '${generatorName}': expected: ${methodArgs.length}, actual: ${callExpr.arguments.length}.`);

        // TODO: move this to AST visitor
        for (let i = 0; i < callExpr.arguments.length; i++)
            callExpr.arguments[i].paramName = methodArgs[i];

        const thisArg = methodRef.thisExpr ? this.gen(methodRef.thisExpr) : null;
        const overlayFunc = this.classGenerators[className].methods[methodName];
        const typeArgs = methodRef.thisExpr && methodRef.thisExpr.valueType.typeArguments.map(x => this.typeName(x));

        const code = overlayFunc.apply(this, [thisArg, typeArgs, ...exprCallArgs, ...extraArgValues]);
        return code;
    }

    gen(obj: one.Statement|one.Expression, ...genArgs: any[]) {
        const objExpr = (<one.Expression> obj);
        const type = (<one.Statement>obj).stmtType || objExpr.exprKind;
        
        if (type === one.ExpressionKind.Call) {
            const callExpr = <one.CallExpression> obj;
            const overlayCallCode = this.getOverlayCallCode(callExpr);
            if (overlayCallCode)
                return overlayCallCode;

            const methodRef = <one.MethodReference> callExpr.method;
            const methodArgs = methodRef.methodRef.parameters;
            if (!methodArgs)
                throw new Error(`Method implementation is not found: ${methodRef.methodRef.metaPath}`);

            if (methodArgs.length !== callExpr.arguments.length)
                throw new Error(`Invalid argument count for '${methodRef.methodRef.metaPath}': expected: ${methodArgs.length}, actual: ${callExpr.arguments.length}.`);

            // TODO: move this to AST visitor
            for (let i = 0; i < methodArgs.length; i++)
                callExpr.arguments[i].paramName = methodArgs[i].name;
        } else if (type === one.ExpressionKind.VariableReference) {
            const varRef = <one.VariableRef> obj;
            if (varRef.varType === one.VariableRefType.InstanceField) {
                const className = varRef.thisExpr.valueType.className;
                const fieldName = varRef.varRef.name;
                const func = this.generator.lang.classes[className].fields[fieldName];
                const thisArg = varRef.thisExpr ? this.gen(varRef.thisExpr) : null;
                const gen = this.classGenerators[className].fields[fieldName];
                //this.log(varPath);
                if (gen) {
                    const code = gen.apply(this, [thisArg]);
                    return code;
                }
            }
        }

        let genName = type.toString();
        if (type === one.ExpressionKind.Literal) {
            const literalExpr = <one.Literal> obj;
            if (literalExpr.literalType === "boolean") {
                genName = `${literalExpr.value ? "True" : "False"}Literal`;
            } else {
                genName = `${literalExpr.literalType.ucFirst()}Literal`;
            }
        } else if (type === one.ExpressionKind.VariableReference) {
            const varRef = <one.VariableRef> obj;
            genName = `${varRef.varType}`;
        } else if (type === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> obj;
            genName = methodRef.thisExpr ? "InstanceMethod" : "StaticMethod";
        } else if (type === one.ExpressionKind.Unary) {
            const unaryExpr = <one.UnaryExpression> obj;
            const unaryName = unaryExpr.unaryType.ucFirst();
            const fullName = `${unaryName}${unaryExpr.operator}`;
            genName = this.expressionGenerators[fullName] ? fullName : unaryName;
        } else if (type === one.ExpressionKind.Binary) {
            const binaryExpr = <one.BinaryExpression> obj;
            const leftType = binaryExpr.left.valueType.repr();
            const rightType = binaryExpr.right.valueType.repr();
            const opGenName = `${leftType} ${binaryExpr.operator} ${rightType}`;
            const opGen = this.operatorGenerators[opGenName];
            if (opGen)
                return opGen.call(this, binaryExpr.left, binaryExpr.right);
        } else if (type === one.StatementType.VariableDeclaration) {
            const varDecl = <one.VariableDeclaration> obj;
            const initType = varDecl.initializer.exprKind;
            if (initType === one.ExpressionKind.MapLiteral
                    && this.expressionGenerators["MapLiteralDeclaration"])
                genName = "MapLiteralDeclaration";
            else if (initType === one.ExpressionKind.Call) {
                const overlayCall = this.getOverlayCallCode(<one.CallExpression> varDecl.initializer, { result: varDecl.name });
                if (overlayCall)
                    return overlayCall;
            }
        }

        if (objExpr.valueType && objExpr.valueType.typeArguments) {
            objExpr.typeArgs = objExpr.valueType.typeArguments.map(x => this.generator.getTypeName(x));
        }

        const genFunc = this.expressionGenerators[genName];
        if (!genFunc)
            throw new Error(`Expression template not found: ${genName}!`);
        const result = genFunc.call(this, obj, ...genArgs);

        //console.log("generate statement", obj, result);

        return result;
    }

    main(): string { return null; }
    testGenerator(cls: string, method: string): string { return null; }
}

export class CodeGenerator {
    model = new CodeGeneratorModel(this);
    templateObjectCode: string;
    templateObject: any;
    generatedCode: string;

    constructor(public schema: one.Schema, public stdlib: one.Schema, public lang: LangFileSchema.LangFile) {
        this.compileTemplates();
        this.setupClasses();
        this.setupIncludes();
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

    getTypeName(type: one.IType): string {
        if (type.typeKind === one.TypeKind.Class) {
            const classGen = this.model.classGenerators[type.className];
            if (classGen)
                return classGen.typeGenerator(type.typeArguments.map(x => this.getTypeName(x)));
            else
                return this.getName(type.className, "class");
        }
        else
            return this.lang.primitiveTypes ? this.lang.primitiveTypes[type.typeKind] : type.typeKind.toString();
    }

    convertIdentifier(origName: string, vars: string[], mode: "variable"|"field"|"declaration") {
        const name = origName === "class" ? "cls" : origName;
        const isLocalVar = vars.includes(name);
        const knownKeyword = ["true", "false"].includes(name);
        return `${isLocalVar || mode === "declaration" || mode === "field" || knownKeyword ? "" : "this."}${name}`;
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
                            type: this.getTypeName(param.type)
                        };
                    }),
                    visibility: method.visibility || "public"
                };
            });

            const fields = Object.values(cls.fields).map(field => {
                return {
                    name: field.name,
                    type: this.getTypeName(field.type),
                    typeInfo: field.type,                    
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
        const includes = {};
        for (const cls of Object.values(this.lang.classes)) {
            for (const include of cls.includes || [])
                includes[include] = true;

            for (const method of Object.values(cls.methods||[]))
                for (const include of method.includes || [])
                    includes[include] = true;
        }

        this.model.includes.push(...Object.keys(includes));
    }

    genName(name: string) {
        return /^[a-zA-Z]+$/.test(name) ? name : `"${name}"`;
    }

    genTemplateMethodCode(name: string, args: string[], template: string) {
        return tmpl`
            ${this.genName(name)}(${[...args, "...args"].join(", ")}) {
                ${this.genTemplate(template, [...args, "args"])}
            },`;
    }

    compileClassMethod(className: string, cls: LangFileSchema.Class, methodName: string) {
        const funcInfo = cls.methods[methodName];
        const stdMethod = this.stdlib.classes[className].methods[methodName];
        const methodArgs = stdMethod ? stdMethod.parameters.map(x => x.name) : [];

        const funcArgs = ["self", "typeArgs", ...methodArgs, ...funcInfo.extraArgs||[]];
        return this.genTemplateMethodCode(methodName, funcArgs, funcInfo.template);
    }

    compileTemplates() {
        this.templateObjectCode = tmpl`
            ({
                expressionGenerators: {
                    ${Object.keys(this.lang.expressions).map(name => 
                        this.genTemplateMethodCode(name.ucFirst(), ["expr"], this.lang.expressions[name])).join("\n\n")}
                },

                classGenerators: {
                    ${Object.keys(this.lang.classes).map(className => {
                        const cls = this.lang.classes[className];
                        return tmpl`
                            ${this.genName(className)}: {
                                ${this.genTemplateMethodCode("typeGenerator", ["typeArgs"], cls.type || className)}

                                methods: {
                                    ${Object.keys(cls.methods||[]).map(methodName => {
                                        return this.compileClassMethod(className, cls, methodName);
                                    }).join("\n\n")}
                                }
                            }`
                    }).join(",\n\n")}
                },

                operatorGenerators: {
                    ${Object.keys(this.lang.operators||{}).map(opName => {
                        const funcInfo = this.lang.operators[opName];
                        return this.genTemplateMethodCode(opName, ["left", "right"], funcInfo.template);
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
        Object.assign(this.model, this.templateObject);
    }

    generate(callTestMethod: boolean) {
        this.generatedCode = this.model.main();
        if (callTestMethod)
            this.generatedCode += "\n\n" + this.model.testGenerator(this.getName("test_class", "class"), this.getName("test_method", "method"));

        this.generatedCode = this.generatedCode.replace(/\{space\}/g, " ");

        return this.generatedCode;
    }
}
