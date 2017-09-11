import { KSLangSchema as ks } from "./KSLangSchema";
import { CodeGenerator } from "./CodeGenerator";

export enum ReferenceType { Class, Method, MethodVariable, ClassVariable }

export class Reference {
    type: ReferenceType;
    className: string;
    methodName: string;
    variableName: string;
}

export class Context {
    variables: VariableContext = null;
    classes: ClassRepository = null;

    constructor(parent: Context = null) {
        this.variables = parent === null ? new VariableContext() : parent.variables.inherit();
        this.classes = parent === null ? new ClassRepository() : parent.classes;
    }

    inherit() {
        return new Context(this);
    }
}

export interface ITiClass {
    getMethod(name: string): ITiMethod;
}

export interface ITiMethod {
    getReturnType(): ks.Type;
}

class KsMethodWrapper implements ITiMethod {
    constructor(public method: ks.Method) { }
    
    getReturnType(): ks.Type {
        return ks.Type.Load(this.method.returns);
    }
}

class KsClassWrapper implements ITiClass {
    constructor(public cls: ks.Class) {
        for (const methodName of Object.keys(this.cls.methods)) {
            const method = this.cls.methods[methodName];
            this.methods[methodName] = new KsMethodWrapper(method);
        }
    }

    methods: { [name: string]: KsMethodWrapper } = {};

    getMethod(name: string): ITiMethod {
        const method = this.methods[name];
        if (!method) {
            console.log(`Method '${name}' not found in class '${this.cls.origName}'.`);
            return null;
        }

        return method;
    }
}

export class ClassRepository {
    classes: { [name: string]: ITiClass } = {};

    addKsClass(cls: ks.Class) {
        this.classes[cls.name] = new KsClassWrapper(cls);
    }

    getClass(name: string) {
        const cls = this.classes[name];
        if (!cls)
            console.log(`Class not found: ${name}.`);
        return cls;
    }
}

export class VariableContext {
    variables: { [name: string]: ks.Type } = {};

    constructor(public parentContext: VariableContext = null) { }

    getType(name: string): ks.Type {
        let currContext = <VariableContext> this;
        while (currContext !== null) {
            const result = currContext.variables[name];
            if (result)
                return result;
            currContext = currContext.parentContext;
        }

        console.log(`Variable not found: ${name}`);
        return ks.Type.Any;
    }

    inherit() {
        return new VariableContext(this);
    }

    add(name: string, type: ks.Type) {
        this.variables[name] = type;
    }
}

export class TypeInferer {
    constructor(public codeGen: CodeGenerator) { }

    log(data: string) {
        console.log(`[TypeInferer] ${data}`);
    }

    processIdentifier(id: ks.Identifier, context: Context) {
        id.valueType = context.variables.getType(id.text);
        //console.log(`Getting identifier: ${id.text} [${id.valueType.repr()}]`);
    }

    processBlock(block: ks.Block, context: Context) {
        for (const statement of block.statements) {
            if (statement.stmtType === ks.StatementType.Return) {
                const stmt = <ks.ReturnStatement> statement;
                this.processExpression(stmt.expression, context);
            } else if (statement.stmtType === ks.StatementType.Expression) {
                const stmt = <ks.ExpressionStatement> statement;
                this.processExpression(stmt.expression, context);
            } else if (statement.stmtType === ks.StatementType.If) {
                const stmt = <ks.IfStatement> statement;
                this.processExpression(stmt.condition, context);
                this.processBlock(stmt.then, context);
                this.processBlock(stmt.else, context);
            } else if (statement.stmtType === ks.StatementType.Throw) {
                const stmt = <ks.ThrowStatement> statement;
                this.processExpression(stmt.expression, context);
            } else if (statement.stmtType === ks.StatementType.Variable) {
                const stmt = <ks.VariableDeclaration> statement;
                this.processExpression(stmt.initializer, context);
                context.variables.add(stmt.variableName, stmt.initializer.valueType);
            } else if (statement.stmtType === ks.StatementType.While) {
                const stmt = <ks.WhileStatement> statement;
                this.processExpression(stmt.condition, context);
                this.processBlock(stmt.body, context);
            } else if (statement.stmtType === ks.StatementType.For) {
                const stmt = <ks.ForStatement> statement;

                this.processExpression(stmt.itemVariable.initializer, context);
                const newContext = context.inherit();
                newContext.variables.add(stmt.itemVariable.variableName,
                    stmt.itemVariable.initializer.valueType);

                this.processExpression(stmt.condition, newContext);
                this.processExpression(stmt.incrementor, newContext);
                this.processBlock(stmt.body, newContext);
            } else if (statement.stmtType === ks.StatementType.Foreach) {
                const stmt = <ks.ForeachStatement> statement;
                this.processExpression(stmt.items, context);
                
                const itemsType = stmt.items.valueType;
                if (!itemsType.isArray) {
                    console.log(`Tried to use foreach on a non-array type: ${itemsType.repr()}!`);
                    stmt.varType = ks.Type.Any;
                } else {
                    stmt.varType = itemsType.typeArguments[0];
                }

                const newContext = context.inherit();
                newContext.variables.add(stmt.varName, stmt.varType);
                this.processBlock(stmt.body, newContext);
            } else {
                this.log(`Unknown statement type: ${statement.stmtType}`);
            }
        }
    }

    processExpression(expression: ks.Expression, context: Context) {
        expression.valueType = new ks.Type();
        expression.valueType.typeKind = ks.TypeKind.Any;

        if (expression.exprKind === ks.ExpressionKind.Binary) {
            const expr = <ks.BinaryExpression> expression;
            this.processExpression(expr.left, context);
            this.processExpression(expr.right, context);

            if (expr.left.valueType.typeKind === ks.TypeKind.Number && expr.right.valueType.typeKind === ks.TypeKind.Number)
                expr.valueType.typeKind = ks.TypeKind.Number;
        } else if (expression.exprKind === ks.ExpressionKind.Call) {
            const expr = <ks.CallExpression> expression;
            this.processExpression(expr.method, context);
            for (const arg of expr.arguments)
                this.processExpression(arg, context);

            if (expr.method.valueType.isMethod) {
                const cls = context.classes.getClass(expr.method.valueType.classType.className);
                const method = cls.getMethod(expr.method.valueType.methodName);
                expr.valueType = method.getReturnType();
            } else {
                console.log(`Tried to call a non-method type '${expr.method.valueType.repr()}'.`);
            }
        } else if (expression.exprKind === ks.ExpressionKind.Conditional) {
            const expr = <ks.ConditionalExpression> expression;
            this.processExpression(expr.condition, context);
            this.processExpression(expr.whenTrue, context);
            this.processExpression(expr.whenFalse, context);
        } else if (expression.exprKind === ks.ExpressionKind.Identifier) {
            const expr = <ks.Identifier> expression;
            this.processIdentifier(expr, context);
        } else if (expression.exprKind === ks.ExpressionKind.New) {
            const expr = <ks.NewExpression> expression;
            this.processExpression(expr.class, context);
            for (const arg of expr.arguments)
                this.processExpression(arg, context);
        } else if (expression.exprKind === ks.ExpressionKind.Literal) {
            const expr = <ks.Literal> expression;
            if (expr.literalType === "numeric")
                expr.valueType.typeKind = ks.TypeKind.Number;
            else if (expr.literalType === "string")
                expr.valueType.typeKind = ks.TypeKind.String;
            else if (expr.literalType === "boolean")
                expr.valueType.typeKind = ks.TypeKind.Boolean;
            else if (expr.literalType === "null")
                expr.valueType.typeKind = ks.TypeKind.Null;
            else
                this.log(`Could not inter literal type: ${expr.literalType}`);
        } else if (expression.exprKind === ks.ExpressionKind.Parenthesized) {
            const expr = <ks.ParenthesizedExpression> expression;
            this.processExpression(expr.expression, context);
            expr.valueType = expr.expression.valueType;
        } else if (expression.exprKind === ks.ExpressionKind.Unary) {
            const expr = <ks.UnaryExpression> expression;
            this.processExpression(expr.operand, context);
        } else if (expression.exprKind === ks.ExpressionKind.PropertyAccess) {
            const expr = <ks.PropertyAccessExpression> expression;
            this.processExpression(expr.object, context);

            const objType = expr.object.valueType;
            if (objType.isClass) {
                const cls = context.classes.getClass(objType.className);
                const method = cls && cls.getMethod(expr.propertyName);
                if (method)
                    expr.valueType = ks.Type.Method(objType, expr.propertyName);
            } else {
                console.log(`Cannot access property '${expr.propertyName}' on object type '${expr.object.valueType.repr()}'.`);
            }
        } else if (expression.exprKind === ks.ExpressionKind.ElementAccess) {
            const expr = <ks.ElementAccessExpression> expression;
            this.processExpression(expr.object, context);
            this.processExpression(expr.elementExpr, context);
        } else if (expression.exprKind === ks.ExpressionKind.ArrayLiteral) {
            const expr = <ks.ArrayLiteralExpression> expression;
            for (const item of expr.items)
                this.processExpression(item, context);

            let itemType = expr.items.length > 0 ? expr.items[0].valueType : ks.Type.Any;
            if (expr.items.some(x => !x.valueType.equals(itemType)))
                itemType = ks.Type.Any;

            expr.valueType = ks.Type.Array(itemType);
        } else {
            this.log(`Unknown expression type: ${expression.exprKind}`);
        }
    }

    getTypeFromString(typeStr: string) {
        // TODO: serious hacks here
        if (typeStr === "int")
            return ks.Type.Number;
        else {
            console.log(`getTypeFromString unknown type: ${typeStr}`);
            return ks.Type.Any;
        }
    }

    getGlobalContext() {
        const context = new Context();
        //context.classes.add("Console");
        context.variables.add("console", ks.Type.Class("Console"));
        return context;
    }

    process() {
        const globalContext = this.getGlobalContext();

        const classes = Object.values(this.codeGen.schema.classes);
        for (const cls of classes)
            globalContext.classes.addKsClass(cls);

        for (const cls of classes) {
            const classContext = globalContext.inherit();
            classContext.variables.add("this", ks.Type.Class(cls.name));
            for (const method of Object.values(cls.methods)) {
                const methodContext = classContext.inherit();
                for (const param of method.parameters)
                    methodContext.variables.add(param.name, ks.Type.Load(param.type));
                this.processBlock(method.body, methodContext);
            }
        }
    }
}
