import { OneAst as one } from "../One/Ast";
import { LangFileSchema } from "./LangFileSchema";
import { SchemaCaseConverter, CaseConverter } from "../One/Transforms/CaseConverter";
import { IncludesCollector } from "../One/Transforms/IncludesCollector";
import { TemplateMethod, TemplateGenerator, GeneratedNode } from "./OneTemplate/TemplateGenerator";
import { VariableContext, VariableSource } from "./ExprLang/ExprLangVM";
import { lcFirst } from "../Utils/StringHelpers";
import { sortBy } from "../Utils/ArrayHelpers";

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
        throws: boolean;
        attributes: { [name: string]: any };
    }

    export interface Constructor {
        visibility: "public"|"protected"|"private";
        parameters: MethodParameter[];
        body: one.Block;
        throws: boolean;
    }

    export interface Class {
        name: string;
        methods: Method[];
        publicMethods: Method[];
        privateMethods: Method[];
        attributes: { [name: string]: any };
    }

    export interface Interface {
        name: string;
        methods: Method[];
        attributes: { [name: string]: any };
    }

    export interface Enum {
        name: string;
        values: { name: string, intValue: number, origName: string }[];
    }
}

class TempVariable {
    constructor(public name: string, public code: GeneratedNode[]) { }
}

class TempVarHandler {
    prefix = "tmp";
    variables: TempVariable[] = [];
    stack: string[] = [];
    nextIndex = 0;

    get empty() { return this.variables.length === 0; }
    get current() { return this.stack[this.stack.length - 1]; }

    create() {
        const name = `${this.prefix}${this.nextIndex++}`;
        this.stack.push(name);
        return name;
    }

    finish(code: GeneratedNode[]) {
        const name = this.stack.pop();
        this.variables.push(new TempVariable(name, code));
        return name;
    }

    reset() {
        const result = this.variables;
        this.stack = [];
        this.variables = [];
        return result;
    }
}

class CodeGeneratorModel {
    tempVarHandler = new TempVarHandler();
    // temporary variable's name
    get result() { return this.tempVarHandler.current; }

    includes: { name: string, source: string }[] = [];
    classes: CodeGeneratorModel.Class[] = [];
    interfaces: CodeGeneratorModel.Interface[] = [];
    enums: CodeGeneratorModel.Enum[] = [];
    config = { genMeta: false };

    constructor(public generator: CodeGenerator) { }

    log(data: string) { console.log(`[CodeGeneratorModel] ${data}`); }

    typeName(type: one.Type) {
        const cls = this.generator.lang.classes[type.className];
        const result = cls ? this.generator.callTmpl(cls, [type.typeArguments.map(x => this.typeName(x)), type.typeArguments]) : this.generator.getTypeName(type);
        return result;
    }

    isIfBlock(block: one.Block) {
        return block.statements && block.statements.length === 1
            && block.statements[0].stmtType === one.StatementType.If;
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

        const cls = this.generator.lang.classes[className];
        const method = cls && cls.methods[methodName];
        // if extraArgs was used then we only accept a method with extra args and vice versa
        if (!method || ((method.extraArgs.length === 0) !== !extraArgs)) return null;

        const extraArgValues = method.extraArgs.map(extraArgName => {
            if (!extraArgs.hasOwnProperty(extraArgName))
                throw new Error(`Extra argument '${extraArgName}' is missing!`);
            return extraArgs[extraArgName];
        });

        const stdMethod = this.generator.stdlib.classes[className].methods[methodName];
        const methodArgs = stdMethod.parameters.map(x => x.outName);
        const exprCallArgs = callExpr.arguments;

        if (methodArgs.length !== exprCallArgs.length)
            throw new Error(`Invalid argument count for '${generatorName}': expected: ${methodArgs.length}, actual: ${callExpr.arguments.length}.`);

        // TODO: move this to AST visitor
        for (let i = 0; i < callExpr.arguments.length; i++)
            callExpr.arguments[i].paramName = methodArgs[i];

        const thisArg = methodRef.thisExpr ? this.gen(methodRef.thisExpr) : null;
        const overlayFunc = this.generator.lang.classes[className].methods[methodName];
        const typeArgs = methodRef.thisExpr && methodRef.thisExpr.valueType.typeArguments.map(x => this.typeName(x));

        const code = this.generator.callTmpl(overlayFunc, [thisArg, typeArgs, ...exprCallArgs, ...extraArgValues]);
        return code;
    }

    escapeQuotes(obj: GeneratedNode[]|string) { 
        if (typeof obj === "string") {
            return obj.replace(/"/g, '\\"');
        } else {
            for (const node of obj)
                node.text = node.text.replace(/"/g, '\\"');
            return obj;
        }
    }

    gen(obj: one.Statement|one.Expression, ...genArgs: any[]): GeneratedNode[] {
        const objExpr = (<one.Expression> obj);
        const type = (<one.Statement>obj).stmtType || objExpr.exprKind;
        const isStatement = !!(<one.Statement>obj).stmtType;
        
        if (type === one.ExpressionKind.Call) {
            const callExpr = <one.CallExpression> obj;
            const overlayCallCode = this.getOverlayCallCode(callExpr);
            if (overlayCallCode)
                return overlayCallCode;

            const methodRef = <one.MethodReference> callExpr.method;
            const methodArgs = methodRef.methodRef.parameters;
            if (!methodArgs)
                throw new Error(`Method implementation is not found: ${methodRef.methodRef.metaPath} for ${this.generator.lang.extension}`);

            if (methodArgs.length !== callExpr.arguments.length)
                throw new Error(`Invalid argument count for '${methodRef.methodRef.metaPath}': expected: ${methodArgs.length}, actual: ${callExpr.arguments.length}.`);

            // TODO: move this to AST visitor
            for (let i = 0; i < methodArgs.length; i++)
                callExpr.arguments[i].paramName = methodArgs[i].outName;
        } else if (type === one.ExpressionKind.New) {
            const callExpr = <one.NewExpression> obj;

            const cls = <one.ClassReference> callExpr.cls;
            const methodRef = cls.classRef.constructor;
            const methodArgs = methodRef ? methodRef.parameters : [];
            if (!methodArgs)
                throw new Error(`Method implementation is not found: ${methodRef.metaPath} for ${this.generator.lang.extension}`);

            if (methodArgs.length !== callExpr.arguments.length)
                throw new Error(`Invalid argument count for '${methodRef.metaPath}': expected: ${methodArgs.length}, actual: ${callExpr.arguments.length}.`);

            // TODO: move this to AST visitor
            for (let i = 0; i < methodArgs.length; i++)
                callExpr.arguments[i].paramName = methodArgs[i].outName;
        } else if (type === one.ExpressionKind.VariableReference) {
            const varRef = <one.VariableRef> obj;
            if (varRef.varType === one.VariableRefType.InstanceField) {
                const className = varRef.thisExpr.valueType.className;
                const fieldName = varRef.varRef.name;
                const cls = this.generator.lang.classes[className];
                if (cls) {
                    const func = cls.fields && cls.fields[fieldName];
                    const thisArg = varRef.thisExpr ? this.gen(varRef.thisExpr) : null;
                    const gen = cls.fields[fieldName];
                    //this.log(varPath);
                    if (gen) {
                        const code = this.generator.callTmpl(gen, [thisArg]);
                        return code;
                    }
                }
            }
        }

        let genName = lcFirst(type.toString());
        if (type === one.ExpressionKind.Literal) {
            const literalExpr = <one.Literal> obj;
            if (literalExpr.literalType === "boolean") {
                genName = `${literalExpr.value ? "true" : "false"}Literal`;
            } else {
                genName = `${literalExpr.literalType}Literal`;
                if (literalExpr.literalType === "string" || literalExpr.literalType === "character") {
                    const escapedJson = JSON.stringify(literalExpr.value);
                    literalExpr.escapedText = escapedJson.substr(1, escapedJson.length - 2);
                    literalExpr.escapedTextSingle = literalExpr.escapedText.replace(/'/g, "\\'");
                }
            }
        } else if (type === one.ExpressionKind.VariableReference) {
            const varRef = <one.VariableRef> obj;
            genName = lcFirst(varRef.varType);
        } else if (type === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> obj;
            genName = methodRef.thisExpr ? "instanceMethod" : "staticMethod";
        } else if (type === one.ExpressionKind.Unary) {
            const unaryExpr = <one.UnaryExpression> obj;
            const unaryName = unaryExpr.unaryType;
            const fullName = `${unaryName}${unaryExpr.operator}`;
            genName = this.generator.lang.expressions[fullName] ? fullName : unaryName;
        } else if (type === one.ExpressionKind.Binary) {
            const binaryExpr = <one.BinaryExpression> obj;
            const leftType = binaryExpr.left.valueType.repr();
            const rightType = binaryExpr.right.valueType.repr();
            const ops = this.generator.lang.operators;
            const opMatch = Object.keys(ops).find(opName => {
                const [left, op, right] = opName.split(' ');
                return binaryExpr.operator === op && (left === "any" || left === leftType) && (right === "any" || right === rightType);
            });
            if (opMatch)
                return this.generator.callTmpl(ops[opMatch], [binaryExpr.left, binaryExpr.right]);

            const fullName = `binary${binaryExpr.operator}`;
            if (this.generator.lang.expressions[fullName])
                genName = fullName;
        } else if (type === one.StatementType.VariableDeclaration) {
            const varDecl = <one.VariableDeclaration> obj;
            const initType = varDecl.initializer.exprKind;
            if (initType === one.ExpressionKind.MapLiteral
                    && this.generator.lang.expressions["mapLiteralDeclaration"])
                genName = "mapLiteralDeclaration";
            else if (initType === one.ExpressionKind.Call) {
                const overlayCall = this.getOverlayCallCode(<one.CallExpression> varDecl.initializer, { result: varDecl.outName });
                if (overlayCall)
                    return overlayCall;
            }
        }

        if (objExpr.valueType && objExpr.valueType.typeArguments) {
            objExpr.typeArgs = objExpr.valueType.typeArguments.map(x => this.generator.getTypeName(x));
        }

        const exprTmpl = this.generator.lang.expressions[genName];
        if (!exprTmpl)
            throw new Error(`Expression template not found: ${genName}!`);

        // TODO (hack): using global "result" and "resultType" variables
        const usingResult = exprTmpl.template.includes("{{result}}");
        
        if (usingResult)
            this.tempVarHandler.create();

        let genResult = this.generator.callTmpl(exprTmpl, [obj, ...genArgs]);

        if (usingResult)
            genResult = [new GeneratedNode(this.tempVarHandler.finish(genResult))];

        if (!usingResult && isStatement && !this.tempVarHandler.empty) {
            const prefix = TemplateGenerator.joinLines(this.tempVarHandler.reset().map(v => v.code), "\n");
            genResult = [...prefix, new GeneratedNode("\n"), ...genResult];
        }

        for (const item of genResult)
            if (!item.astNode)
                item.astNode = obj;

        return genResult;
    }

    clsName(obj: one.Class) {
        const cls = this.generator.lang.classes[obj.name];
        return cls && cls.template ? cls.template : obj.outName;
    }
}

export class CodeGenerator {
    model = new CodeGeneratorModel(this);
    caseConverter: SchemaCaseConverter;
    generatedCode: string;
    templateGenerator: TemplateGenerator;
    templateVars = new VariableSource("Templates");
    includes: { [name: string]: string } = {}; // name -> path

    // templates: { [name: string]: TemplateMethod } = {};
    // operatorGenerators: { [name: string]: TemplateMethod } = {};
    // expressionGenerators: { [name: string]: TemplateMethod } = {};
    // classGenerators: { 
    //     [className: string]: {
    //         typeGenerator: TemplateMethod,
    //         methods: { [methodName: string]: TemplateMethod },
    //         fields: { [fieldName: string]: TemplateMethod }
    //     }
    // } = {};

    constructor(public schema: one.Schema, public stdlib: one.Schema, public lang: LangFileSchema.LangFile) {
        this.caseConverter = new SchemaCaseConverter(lang.casing);
        this.setupTemplateGenerator();
        this.setupEnums();
        this.setupClasses();
        this.setupIncludes();
    }

    setupTemplateGenerator() {
        const codeGenVars = new VariableSource("CodeGeneratorModel");
        codeGenVars.addCallback("includes", () => this.model.includes);
        codeGenVars.addCallback("classes", () => this.model.classes);
        codeGenVars.addCallback("config", () => this.model.config);
        // TODO: hack, see https://github.com/koczkatamas/onelang/issues/17
        codeGenVars.addCallback("reflectedClasses", () => this.model.classes.filter(x => x.attributes["reflect"]));
        codeGenVars.addCallback("interfaces", () => this.model.interfaces);
        codeGenVars.addCallback("enums", () => this.model.enums);
        codeGenVars.addCallback("mainBlock", () => this.schema.mainBlock);
        codeGenVars.addCallback("result", () => this.model.result);
        codeGenVars.setVariable("include", name => { this.includes[name] = name; return null; });
        for (const name of ["gen", "isIfBlock", "typeName", "escapeQuotes", "clsName"])
            codeGenVars.setVariable(name, (...args) => this.model[name].apply(this.model, args));
        for (const name of Object.keys(this.lang.templates))
            this.templateVars.setVariable(name, this.lang.templates[name].generator);
        const varContext = new VariableContext([codeGenVars, this.templateVars]);
        this.templateGenerator = new TemplateGenerator(varContext);
        this.templateGenerator.objectHook = obj => this.model.gen(<any> obj);
    }

    call(method: TemplateMethod, args: any[]) {
        const callStackItem = this.templateGenerator.callStack[this.templateGenerator.callStack.length - 1];
        const varContext = callStackItem ? callStackItem.vars : this.templateGenerator.rootVars;
        return this.templateGenerator.methodCall(method, args, this.model, varContext);
    }

    callTmpl(tmpl: LangFileSchema.TemplateObj, args: any[]) {
        for (const incl of tmpl.includes || [])
            this.includes[incl] = incl;
        return this.call(tmpl.generator, args);
    }

    getTypeName(type: one.Type): string {
        if (!type) return "???";
        if (type.isClassOrInterface) {
            const cls = this.model.generator.lang.classes[type.className];
            if (cls) {
                return this.callTmpl(cls, [type.typeArguments.map(x => this.getTypeName(x)), type.typeArguments])
                    .map(x => x.text).join("");
            } else {
                let result = this.caseConverter.getName(type.className, "class");
                if (type.typeArguments && type.typeArguments.length > 0) {
                    // TODO: make this templatable
                    result += `<${type.typeArguments.map(x => this.getTypeName(x)).join(", ")}>`;
                }
                return result;
            }
        } else if (type.isEnum) {
            return this.caseConverter.getName(type.enumName, "enum");
        } else if (type.isGenerics) {
            return this.lang.genericsOverride ? this.lang.genericsOverride : type.genericsName;
        } else {
            return this.lang.primitiveTypes ? this.lang.primitiveTypes[type.typeKind] : type.typeKind.toString();
        }
    }

    convertIdentifier(name: string, vars: string[], mode: "variable"|"field"|"declaration") {
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

    genParameters(method: one.Method|one.Constructor) {
        return method.parameters.map((param, idx) => <CodeGeneratorModel.MethodParameter> {
            idx,
            name: param.outName,
            type: this.getTypeName(param.type),
            typeInfo: param.type
        });
    }

    setupIncludes() {
        const includesCollector = new IncludesCollector(this.lang);
        includesCollector.process(this.schema);
        for (const name of includesCollector.includes)
            this.includes[name] = this.lang.includeSources[name] || name;
        this.model.includes = sortBy(Object.entries(this.includes).map(x => ({ name: x[0], source: x[1] })), x => x.name);
    }

    setupEnums() {
        this.model.enums = Object.values(this.schema.enums).map(enum_ => {
            return <CodeGeneratorModel.Enum> {
                name: enum_.outName,
                values: enum_.values.map((x, i) => ({ name: x.outName, intValue: i, origName: x.name }))
            }
        });
    }

    convertMethod(method: one.Method) {
        return <CodeGeneratorModel.Method> {
            name: method.outName,
            returnType: this.getTypeName(method.returns),
            returnTypeInfo: method.returns,
            body: method.body,
            parameters: this.genParameters(method),
            visibility: method.visibility || "public",
            static: method.static || false,
            throws: method.throws || false,
            attributes: method.attributes,
        };
    }

    setupClasses() {
        this.model.interfaces = Object.values(this.schema.interfaces).map(intf => {
            const methods = Object.values(intf.methods).map(method => this.convertMethod(method));
            return <CodeGeneratorModel.Interface> {
                name: intf.outName,
                methods: methods,
                typeArguments: intf.typeArguments && intf.typeArguments.length > 0 ? intf.typeArguments : null,
                baseInterfaces: intf.baseInterfaces,
                baseClasses: intf.baseInterfaces,
                attributes: intf.attributes,
            };
        });

        this.model.classes = Object.values(this.schema.classes).map(cls => {
            const methods = Object.values(cls.methods).map(method => this.convertMethod(method));

            const constructor = cls.constructor ? <CodeGeneratorModel.Constructor> {
                body: cls.constructor.body,
                parameters: this.genParameters(cls.constructor),
                throws: cls.constructor.throws || false
            } : null;
            
            const fields = Object.values(cls.fields).map(field => {
                return {
                    name: this.caseConverter.getName(field.outName, "field"),
                    type: this.getTypeName(field.type),
                    typeInfo: field.type,                    
                    visibility: field.visibility || "public",
                    public: field.visibility ? field.visibility === "public" : true,
                    initializer: field.initializer,
                    static: field.static || false
                }
            });

            return <CodeGeneratorModel.Class> {
                name: cls.outName,
                methods: methods,
                constructor,
                typeArguments: cls.typeArguments && cls.typeArguments.length > 0 ? cls.typeArguments : null,
                baseClass: cls.baseClass,
                baseInterfaces: cls.baseInterfaces,
                baseClasses: (cls.baseClass ? [cls.baseClass] : []).concat(cls.baseInterfaces),
                attributes: cls.attributes,
                // TODO: hack, see https://github.com/koczkatamas/onelang/issues/17
                needsConstructor: constructor !== null || fields.some(x => x.visibility === "public" && !x.static && !!x.initializer),
                virtualMethods: methods.filter(x => x.attributes["virtual"]),
                publicMethods: methods.filter(x => x.visibility === "public"),
                protectedMethods: methods.filter(x => x.visibility === "protected"),
                privateMethods: methods.filter(x => x.visibility === "private"),
                fields: fields,
                instanceFields: fields.filter(x => !x.static),
                staticFields: fields.filter(x => x.static),
                publicFields: fields.filter(x => x.visibility === "public"),
                protectedFields: fields.filter(x => x.visibility === "protected"),
                privateFields: fields.filter(x => x.visibility === "private"),
            };
        });
    }

    generate(callTestMethod: boolean) {
        this.generatedCode = "";

        const mainNodes = this.callTmpl(this.lang.templates["main"], []) || [];
        // main template in the previous line is already generated the dynamic include list which we can use now
        this.model.includes = sortBy(Object.entries(this.includes).map(x => ({ name: x[0], source: x[1] })), x => x.name);
        const includesNodes = this.lang.templates["includes"] ? this.call(this.lang.templates["includes"].generator, []) : null;

        const processNodes = (nodes: GeneratedNode[]) => {
            for (const tmplNode of nodes) {
                if (tmplNode.astNode && tmplNode.astNode.nodeData) {
                    const nodeData = tmplNode.astNode.nodeData;
                    let dstRange = nodeData.destRanges[this.lang.name];
                    if (!dstRange)
                        dstRange = nodeData.destRanges[this.lang.name] = { start: this.generatedCode.length, end: -1 };
                    dstRange.end = this.generatedCode.length + tmplNode.text.length;
                }
                this.generatedCode += tmplNode.text;
            }
        }

        if (includesNodes) {
            processNodes(includesNodes);
            this.generatedCode += "\n\n";
        }
        processNodes(mainNodes);

        if (callTestMethod) {
            const testClassName = this.caseConverter.getName("test_class", "class");
            const testMethodName = this.caseConverter.getName("test_method", "method");
            const testClass = this.model.classes.find(x => x.name === testClassName);
            if (testClass) {
                const testMethod = testClass.methods.find(x => x.name === testMethodName);
                this.generatedCode += "\n\n" + this.callTmpl(this.lang.templates["testGenerator"],
                    [testClassName, testMethodName, testMethod]).map(x => x.text).join("");
            }
        }

        return this.generatedCode;
    }
}
