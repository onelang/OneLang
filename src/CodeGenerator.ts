import { KSLangSchema as ks } from "./KSLangSchema";
import { TypeScriptParser } from "./TypeScriptParser";
import { Template } from "./TemplateCompiler";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";

export namespace KsLangSchema {
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

namespace CodeGeneratorSchema {
    export interface MethodParameter {
        idx: number;
        name: string;
        type: string;
    }

    export interface Method {
        visibility: "public"|"protected"|"private";
        name: string;
        origName: string;
        parameters: MethodParameter[];
        returnType: string;
        body: ks.Block;
    }

    export interface Class {
        name: string;
        origName: string;
        methods: Method[];
        publicMethods: Method[];
        privateMethods: Method[];
    }

    export interface Root {
        absoluteIncludes: string[];
        classes: Class[];
        main?: () => string;
    }
}

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

class CodeGeneratorModel {
    includes: string[] = [];
    absoluteIncludes: string[] = [];
    classes: CodeGeneratorSchema.Class[] = [];
    expressionGenerators: { [name: string]: (expr: any) => string } = {};
    internalMethodGenerators: { [name: string]: (expr: any) => string } = {};

    constructor(public generator: CodeGenerator) { }
    
    gen(obj: ks.Statement|ks.Expression) {
        if (obj.type === ks.StatementType.Expression)
            obj = (<ks.ExpressionStatement>obj).expression;

        if (obj.type === ks.ExpressionType.Call) {
            const callExpr = <ks.CallExpression> obj;
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

        let genName = obj.type.toString();
        if (genName === ks.ExpressionType.Literal) {
            const literalExpr = <ks.Literal> obj;
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
    schema: ks.SchemaFile;
    model = new CodeGeneratorModel(this);
    templateObjectCode: string;
    templateObject;

    constructor(schema: ks.SchemaFile, public lang: KsLangSchema.LangFile) {
        this.schema = JSON.parse(JSON.stringify(schema)); // clone
        this.setupNames();
        this.setupClasses();
        this.setupIncludes();
        this.compileTemplates();
    }

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

    genTemplate(template: string, args: string[]) {
        const tmpl = new Template(template, args);
        tmpl.convertIdentifier = this.convertIdentifier;
        return `return tmpl\`\n${tmpl.templateToJS(tmpl.treeRoot, args)}\`;`;
    }

    setupNames() {
        for (const enumName of Object.keys(this.schema.enums)) {
            const enumObj = this.schema.enums[enumName];
            enumObj.origName = enumName;
            enumObj.name = this.getName(enumName, "enum");
        }

        for (const className of Object.keys(this.schema.classes)) {
            const cls = this.schema.classes[className];
            cls.origName = className;
            cls.name = this.getName(className, "class");

            for (const methodName of Object.keys(cls.methods)) {
                const method = cls.methods[methodName];
                method.origName = methodName;
                method.name = this.getName(methodName, "method");
            }
        }
    }

    setupClasses() {
        this.model.classes = Object.keys(this.schema.classes).map(className => {
            const cls = this.schema.classes[className];
            const methods = Object.keys(cls.methods).map(methodName => {
                const method = cls.methods[methodName];
                return <CodeGeneratorSchema.Method> {
                    name: method.name,
                    origName: method.origName,
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
                name: cls.name,
                origName: cls.origName,
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
                    const tmplObj = typeof tmplOrig === "string" ? <KsLangSchema.TemplateObj>{ template: tmplOrig, args: [] } : tmplOrig;
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

    generateOverview() {
        return new KsLangOverviewGenerator(this).result;
    }
}

class KsLangTypeInterferer {
    constructor(public codeGen: CodeGenerator) {
        this.process();
    }

    processBlock(block: ks.Block) {
        for (const statement of block.statements) {
            if (statement.type === ks.StatementType.Return) {
                const stmt = <ks.ReturnStatement> statement;
                this.processExpression(stmt.expression);
            } else if (statement.type === ks.StatementType.Expression) {
                const stmt = <ks.ExpressionStatement> statement;
                this.processExpression(stmt.expression);
            } else if (statement.type === ks.StatementType.If) {
                const stmt = <ks.IfStatement> statement;
                this.processExpression(stmt.condition);
                this.processBlock(stmt.then);
                this.processBlock(stmt.else);
            } else if (statement.type === ks.StatementType.Throw) {
                const stmt = <ks.ThrowStatement> statement;
                this.processExpression(stmt.expression);
            } else if (statement.type === ks.StatementType.Variable) {
                const stmt = <ks.VariableDeclaration> statement;
                this.processExpression(stmt.initializer);
            } else if (statement.type === ks.StatementType.While) {
                const stmt = <ks.WhileStatement> statement;
                this.processExpression(stmt.condition);
                this.processBlock(stmt.body);
            }
        }
    }

    processExpression(expression: ks.Expression) {
        if (expression.type === ks.ExpressionType.Binary) {
            const expr = <ks.BinaryExpression> expression;
            this.processExpression(expr.left);
            this.processExpression(expr.right);
        } else if (expression.type === ks.ExpressionType.Call) {
            const expr = <ks.CallExpression> expression;
            this.processExpression(expr.method);
            for (const arg of expr.arguments)
                this.processExpression(arg);
        } else if (expression.type === ks.ExpressionType.Conditional) {
            const expr = <ks.ConditionalExpression> expression;
            this.processExpression(expr.condition);
            this.processExpression(expr.whenTrue);
            this.processExpression(expr.whenFalse);
        } else if (expression.type === ks.ExpressionType.Identifier) {
            const expr = <ks.Identifier> expression;
        } else if (expression.type === ks.ExpressionType.New) {
            const expr = <ks.NewExpression> expression;
            this.processExpression(expr.class);
            for (const arg of expr.arguments)
                this.processExpression(arg);
        } else if (expression.type === ks.ExpressionType.Literal) {
            const expr = <ks.Literal> expression;
        } else if (expression.type === ks.ExpressionType.Parenthesized) {
            const expr = <ks.ParenthesizedExpression> expression;
            this.processExpression(expr.expression);
        } else if (expression.type === ks.ExpressionType.Unary) {
            const expr = <ks.UnaryExpression> expression;
            this.processExpression(expr.operand);
        } else if (expression.type === ks.ExpressionType.PropertyAccess) {
            const expr = <ks.PropertyAccessExpression> expression;
            this.processExpression(expr.object);
            this.processExpression(expr.propertyName);
        }
    }

    process() {
        for (const cls of this.codeGen.model.classes) {
            for (const method of cls.methods) {
                this.processBlock(method.body);
            }
        }
    }
}

class KsLangOverviewGenerator {
    result = "";
    pad = "";
    padWasAdded = false;

    constructor(public codeGen: CodeGenerator) {
        this.generate();
    }

    addLine(line: string) {
        this.add(`${line}\n`);
        this.padWasAdded = false;
    }

    add(data: string) {
        if (!this.padWasAdded) {
            this.result += this.pad;
            this.padWasAdded = true;
        }

        this.result += data;
    }

    indent(num: -1|1) {
        if (num === 1)
            this.pad += "  ";
        else
            this.pad = this.pad.substr(0, this.pad.length - 2);
    }

    printBlock(block: ks.Block) {
        this.indent(1);

        for (const statement of block.statements) {
            this.add("- ");
            if (statement === null) {
                this.addLine("<null>");
            } else if (statement.type === ks.StatementType.Return) {
                const stmt = <ks.ReturnStatement> statement;
                this.addLine(`Return`);
                this.printExpression(stmt.expression);
            } else if (statement.type === ks.StatementType.Expression) {
                const stmt = <ks.ExpressionStatement> statement;
                this.addLine(`Expression`);
                this.printExpression(stmt.expression);
            } else if (statement.type === ks.StatementType.If) {
                const stmt = <ks.IfStatement> statement;
                this.addLine(`If`);
                this.printExpression(stmt.condition);
                this.addLine(`Then`);
                this.printBlock(stmt.then);
                this.addLine(`Else`);
                this.printBlock(stmt.else);
            } else if (statement.type === ks.StatementType.Throw) {
                const stmt = <ks.ThrowStatement> statement;
                this.printExpression(stmt.expression);
            } else if (statement.type === ks.StatementType.Variable) {
                const stmt = <ks.VariableDeclaration> statement;
                this.addLine(`Variable: ${stmt.variableName}`);
                this.printExpression(stmt.initializer);
            } else if (statement.type === ks.StatementType.While) {
                const stmt = <ks.WhileStatement> statement;
                this.addLine(`While`);
                this.printExpression(stmt.condition);
                this.addLine(`Body`);
                this.printBlock(stmt.body);
            } else if (statement.type === ks.StatementType.Foreach) {
                const stmt = <ks.ForeachStatement> statement;
                this.addLine(`Foreach ${stmt.itemVariable.variableName}: ${stmt.itemVariable.type}`);
                this.addLine(`Items`);
                this.printExpression(stmt.items);
                this.addLine(`Body`);
                this.printBlock(stmt.body);
            } else if (statement.type === ks.StatementType.For) {
                const stmt = <ks.ForStatement> statement;
                this.addLine(`For ("${stmt.itemVariable.variableName}")`);
                this.addLine(`Condition`);
                this.printExpression(stmt.condition);
                this.addLine(`Incrementor`);
                this.printExpression(stmt.incrementor);
                this.addLine(`Body`);
                this.printBlock(stmt.body);
            } else {
                console.log(`Unknown statement type: ${statement.type}`);
                this.addLine(`${statement.type} (unknown!)`);
            }
        }

        this.indent(-1);
    }

    printExpression(expression: ks.Expression) {
        this.indent(1);
        
        this.add("- ");
        if (expression === null) {
            this.addLine("<null>");
        } else if (expression.type === ks.ExpressionType.Binary) {
            const expr = <ks.BinaryExpression> expression;
            this.addLine(`Binary: ${expr.operator}`);
            this.printExpression(expr.left);
            this.printExpression(expr.right);
        } else if (expression.type === ks.ExpressionType.Call) {
            const expr = <ks.CallExpression> expression;
            this.addLine(`Call`);
            this.printExpression(expr.method);
            for (const arg of expr.arguments)
                this.printExpression(arg);
        } else if (expression.type === ks.ExpressionType.Conditional) {
            const expr = <ks.ConditionalExpression> expression;
            this.addLine(`Conditional`);
            this.printExpression(expr.condition);
            this.printExpression(expr.whenTrue);
            this.printExpression(expr.whenFalse);
        } else if (expression.type === ks.ExpressionType.Identifier) {
            const expr = <ks.Identifier> expression;
            this.addLine(`Identifier: ${expr.text}`);
        } else if (expression.type === ks.ExpressionType.New) {
            const expr = <ks.NewExpression> expression;
            this.addLine(`New`);
            this.printExpression(expr.class);
            for (const arg of expr.arguments)
                this.printExpression(arg);
        } else if (expression.type === ks.ExpressionType.Literal) {
            const expr = <ks.Literal> expression;
            const value = expr.literalType === "string" ? `"${expr.value}"` : expr.value;
            this.addLine(`Literal (${expr.literalType}): ${value}`);
        } else if (expression.type === ks.ExpressionType.Parenthesized) {
            const expr = <ks.ParenthesizedExpression> expression;
            this.addLine(`Parenthesized`);
            this.printExpression(expr.expression);
        } else if (expression.type === ks.ExpressionType.Unary) {
            const expr = <ks.UnaryExpression> expression;
            this.addLine(`Unary (${expr.unaryType}): ${expr.operator}`);
            this.printExpression(expr.operand);
        } else if (expression.type === ks.ExpressionType.PropertyAccess) {
            const expr = <ks.PropertyAccessExpression> expression;
            this.addLine(`PropertyAccess`);
            this.printExpression(expr.object);
            this.printExpression(expr.propertyName);
        } else if (expression.type === ks.ExpressionType.ArrayLiteral) {
            const expr = <ks.ArrayLiteralExpression> expression;
            this.addLine(`ArrayLiteral`);
            for (const item of expr.items)
                this.printExpression(item);
        } else {
            console.log(`Unknown expression type: ${expression.type}`);
            this.addLine(`${expression.type} (unknown!)`);
        }

        this.indent(-1);
    }

    generate() {
        for (const cls of this.codeGen.model.classes) {
            for (const method of cls.methods) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type}`).join(", ");
                this.addLine(`${cls.origName}::${method.origName}(${argList}): ${method.returnType}`);
                this.printBlock(method.body);
                this.addLine("");
            }
        }
    }
}