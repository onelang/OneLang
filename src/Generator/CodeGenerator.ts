import { OneAst as one } from "../One/Ast";
import { ExprLangParser } from "./ExprLang/ExprLangParser";
import { OverviewGenerator } from "../One/OverviewGenerator";
import { LangFileSchema } from "./LangFileSchema";
import { deindent } from "./Utils";
import { SchemaCaseConverter, CaseConverter } from "../One/Transforms/CaseConverter";
import { IncludesCollector } from "../One/Transforms/IncludesCollector";
import { TemplateMethod, TemplateGenerator, GeneratedNode } from "./OneTemplate/TemplateGenerator";
import { VariableContext, VariableSource } from "./ExprLang/ExprLangVM";

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
    get current() { return this.stack.last(); }

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

    includes: string[] = [];
    classes: CodeGeneratorModel.Class[] = [];
    enums: CodeGeneratorModel.Enum[] = [];

    constructor(public generator: CodeGenerator) { }

    log(data: string) { console.log(`[CodeGeneratorModel] ${data}`); }

    typeName(type: one.Type) {
        const cls = this.generator.classGenerators[type.className];
        const result = cls ? this.generator.call(cls.typeGenerator, [type.typeArguments.map(x => this.typeName(x))]) : this.generator.getTypeName(type);
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
        const method = cls && (cls.methods||{})[methodName];
        // if extraArgs was used then we only accept a method with extra args and vice versa
        if (!method || (!!method.extraArgs !== !!extraArgs)) return null;

        const extraArgValues = (method.extraArgs||[]).map(extraArgName => {
            if (!extraArgs.hasOwnProperty(extraArgName))
                throw new Error(`Extra argument '${extraArgName}' is missing!`);
            return extraArgs[extraArgName];
        });

        const stdMethod = this.generator.stdlib.classes[className].methods[methodName];
        const methodArgs = stdMethod.parameters.map(x => x.outName);
        const exprCallArgs = callExpr.arguments.map(x => this.gen(x));

        if (methodArgs.length !== exprCallArgs.length)
            throw new Error(`Invalid argument count for '${generatorName}': expected: ${methodArgs.length}, actual: ${callExpr.arguments.length}.`);

        // TODO: move this to AST visitor
        for (let i = 0; i < callExpr.arguments.length; i++)
            callExpr.arguments[i].paramName = methodArgs[i];

        const thisArg = methodRef.thisExpr ? this.gen(methodRef.thisExpr) : null;
        const overlayFunc = this.generator.classGenerators[className].methods[methodName];
        const typeArgs = methodRef.thisExpr && methodRef.thisExpr.valueType.typeArguments.map(x => this.typeName(x));

        const code = this.generator.call(overlayFunc, [thisArg, typeArgs, ...exprCallArgs, ...extraArgValues]);
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
                    const gen = (this.generator.classGenerators[className].fields||{})[fieldName];
                    //this.log(varPath);
                    if (gen) {
                        const code = this.generator.call(gen, [thisArg]);
                        return code;
                    }
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
                if (literalExpr.literalType === "string" || literalExpr.literalType === "character") {
                    const escapedJson = JSON.stringify(literalExpr.value);
                    literalExpr.escapedText = escapedJson.substr(1, escapedJson.length - 2);
                    literalExpr.escapedTextSingle = literalExpr.escapedText.replace(/'/g, "\\'");
                }
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
            genName = this.generator.expressionGenerators[fullName] ? fullName : unaryName;
        } else if (type === one.ExpressionKind.Binary) {
            const binaryExpr = <one.BinaryExpression> obj;
            const leftType = binaryExpr.left.valueType.repr();
            const rightType = binaryExpr.right.valueType.repr();
            const opGens = this.generator.operatorGenerators;
            const opGenMatch = Object.keys(opGens).find(opGenName => {
                const [left, op, right] = opGenName.split(' ');
                return binaryExpr.operator === op && (left === "any" || left === leftType) && (right === "any" || right === rightType);
            });
            if (opGenMatch)
                return this.generator.call(opGens[opGenMatch], [binaryExpr.left, binaryExpr.right]);

            const fullName = `Binary${binaryExpr.operator}`;
            if (this.generator.expressionGenerators[fullName])
                genName = fullName;
        } else if (type === one.StatementType.VariableDeclaration) {
            const varDecl = <one.VariableDeclaration> obj;
            const initType = varDecl.initializer.exprKind;
            if (initType === one.ExpressionKind.MapLiteral
                    && this.generator.expressionGenerators["MapLiteralDeclaration"])
                genName = "MapLiteralDeclaration";
            else if (initType === one.ExpressionKind.Call) {
                const overlayCall = this.getOverlayCallCode(<one.CallExpression> varDecl.initializer, { result: varDecl.outName });
                if (overlayCall)
                    return overlayCall;
            }
        }

        if (objExpr.valueType && objExpr.valueType.typeArguments) {
            objExpr.typeArgs = objExpr.valueType.typeArguments.map(x => this.generator.getTypeName(x));
        }

        const genFunc = this.generator.expressionGenerators[genName];
        if (!genFunc)
            throw new Error(`Expression template not found: ${genName}!`);

        // TODO (hack): using global "result" and "resultType" variables
        const usingResult = genFunc.template.includes("{{result}}");
        
        if (usingResult)
            this.tempVarHandler.create();

        let genResult = this.generator.call(genFunc, [obj, ...genArgs]);

        if (usingResult)
            genResult = [new GeneratedNode(this.tempVarHandler.finish(genResult))];

        if (!usingResult && isStatement && !this.tempVarHandler.empty) {
            const prefix = this.tempVarHandler.reset().map(v => v.code).join("\n") + "\n";
            genResult = [new GeneratedNode(prefix), ...genResult];
        }

        for (const item of genResult)
            if (!item.astNode)
                item.astNode = obj;

        return genResult;
    }

    clsName(obj: one.Class) {
        const cls = (this.generator.lang.classes||{})[obj.name];
        return cls && cls.template ? cls.template : obj.outName;
    }
}

export class CodeGenerator {
    model = new CodeGeneratorModel(this);
    caseConverter: SchemaCaseConverter;
    generatedCode: string;
    templateGenerator: TemplateGenerator;
    templateVars = new VariableSource("Templates");

    templates: { [name: string]: TemplateMethod } = {};
    operatorGenerators: { [name: string]: TemplateMethod } = {};
    expressionGenerators: { [name: string]: TemplateMethod } = {};
    classGenerators: { 
        [className: string]: {
            typeGenerator: TemplateMethod,
            methods: { [methodName: string]: TemplateMethod },
            fields: { [fieldName: string]: TemplateMethod }
        }
    } = {};

    constructor(public schema: one.Schema, public stdlib: one.Schema, public lang: LangFileSchema.LangFile) {
        this.caseConverter = new SchemaCaseConverter(lang.casing);
        this.setupTemplateGenerator();
        this.compileTemplates();
        this.setupEnums();
        this.setupClasses();
        this.setupIncludes();
    }

    setupTemplateGenerator() {
        const codeGenVars = new VariableSource("CodeGeneratorModel");
        codeGenVars.addCallback("includes", () => this.model.includes);
        codeGenVars.addCallback("classes", () => this.model.classes);
        codeGenVars.addCallback("enums", () => this.model.enums);
        codeGenVars.addCallback("result", () => this.model.result);
        for (const name of ["gen", "isIfBlock", "typeName", "hackPerlToVar", "escapeQuotes", "clsName"])
            codeGenVars.setVariable(name, (...args) => this.model[name].apply(this.model, args));
        const varContext = new VariableContext([codeGenVars, this.templateVars]);
        this.templateGenerator = new TemplateGenerator(varContext);
    }

    call(method: TemplateMethod, args: any[]) {
        const callStackItem = this.templateGenerator.callStack.last();
        const varContext = callStackItem ? callStackItem.vars : this.templateGenerator.rootVars;
        return this.templateGenerator.call(method, args, this.model, varContext);
    }

    getTypeName(type: one.Type): string {
        if (type.isClass) {
            const classGen = this.model.generator.classGenerators[type.className];
            if (classGen) {
                return this.call(classGen.typeGenerator, [type.typeArguments.map(x => this.getTypeName(x))])
                    .map(x => x.text).join("");
            } else
                return this.caseConverter.getName(type.className, "class");
        } else if (type.isEnum) {
            return this.caseConverter.getName(type.enumName, "enum");
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
        this.model.includes = Array.from(includesCollector.includes);
    }

    setupEnums() {
        this.model.enums = Object.values(this.schema.enums).map(enum_ => {
            return <CodeGeneratorModel.Enum> {
                name: enum_.outName,
                values: enum_.values.map((x, i) => ({ name: x.outName, intValue: i, origName: x.name }))
            }
        });
    }

    setupClasses() {
        this.model.classes = Object.values(this.schema.classes).map(cls => {
            const methods = Object.values(cls.methods).map(method => {
                return <CodeGeneratorModel.Method> {
                    name: method.outName,
                    returnType: this.getTypeName(method.returns),
                    returnTypeInfo: method.returns,
                    body: method.body,
                    parameters: this.genParameters(method),
                    visibility: method.visibility || "public",
                    static: method.static || false,
                    throws: method.throws || false
                };
            });

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
                // TODO: hack
                needsConstructor: constructor !== null || fields.some(x => x.visibility === "public" && !x.static && !!x.initializer),
                reflect: (cls.leadingTrivia||"").includes("@reflect"), // TODO: replace this with real attribute/decorator handling
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

    compileTemplates() {
        for (const name of Object.keys(this.lang.expressions||{})) {
            const templateObj = this.lang.expressions[name];
            const template = typeof(templateObj) === "string" ? templateObj : templateObj.template;
            this.expressionGenerators[name.ucFirst()] = new TemplateMethod(name.ucFirst(), ["expr"], template);
        }

        for (const name of Object.keys(this.lang.operators||{}))
            this.operatorGenerators[name] = new TemplateMethod(name, ["left", "right"], this.lang.operators[name].template);

        for (const name of Object.keys(this.lang.templates||{})) {
            const tmplOrig = this.lang.templates[name]; 
            const tmplObj = typeof tmplOrig === "string" ? <LangFileSchema.TemplateObj>{ template: tmplOrig, args: [] } : tmplOrig; 
            if (name === "testGenerator") 
                tmplObj.args = [{ name: "class" }, { name: "method" }, { name: "methodInfo" }];
            
            this.templates[name] = new TemplateMethod(name, tmplObj.args.map(x => x.name), tmplObj.template);
            this.templateVars.setVariable(name, this.templates[name]);
        }

        for (const clsName of Object.keys(this.lang.classes||{})) {
            const cls = this.lang.classes[clsName]; 
            const clsGen = this.classGenerators[clsName] = {
                typeGenerator: new TemplateMethod("typeGenerator", ["typeArgs"], cls.type || clsName),
                methods: {},
                fields: {},
            };

            for (const methodName of Object.keys(cls.methods||[])) {
                const funcInfo = cls.methods[methodName]; 
                const stdMethod = this.stdlib.classes[clsName].methods[methodName]; 
                const methodArgs = stdMethod ? stdMethod.parameters.map(x => x.outName) : []; 
                const funcArgs = ["self", "typeArgs", ...methodArgs, ...funcInfo.extraArgs||[]];
                clsGen.methods[methodName] = new TemplateMethod(methodName, funcArgs, funcInfo.template);
            }

            for (const fieldName of Object.keys(cls.fields||[])) {
                const fieldInfo = cls.fields[fieldName];
                const stdField = this.stdlib.classes[clsName].fields[fieldName];
                const funcArgs = ["self", "typeArgs"];
                clsGen.fields[fieldName] = new TemplateMethod(fieldName, funcArgs, fieldInfo.template); 
            }
        }
    }

    generate(callTestMethod: boolean) {
        const generatedNodes = this.call(this.templates["main"], []);
        this.generatedCode = "";
        for (const tmplNode of generatedNodes) {
            if (tmplNode.astNode && tmplNode.astNode.nodeData) {
                const nodeData = tmplNode.astNode.nodeData;
                let dstRange = nodeData.destRanges[this.lang.name];
                if (!dstRange)
                    dstRange = nodeData.destRanges[this.lang.name] = { start: this.generatedCode.length, end: -1 };
                dstRange.end = this.generatedCode.length + tmplNode.text.length;
            }
            this.generatedCode += tmplNode.text;
        }

        if (callTestMethod) {
            const testClassName = this.caseConverter.getName("test_class", "class");
            const testMethodName = this.caseConverter.getName("test_method", "method");
            const testClass = this.model.classes.find(x => x.name === testClassName);
            if (testClass) {
                const testMethod = testClass.methods.find(x => x.name === testMethodName);
                this.generatedCode += "\n\n" + this.call(this.templates["testGenerator"], 
                    [testClassName, testMethodName, testMethod]).map(x => x.text).join("");
            }
        }

        return this.generatedCode;
    }
}
