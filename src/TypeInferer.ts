import { KSLangSchema as ks } from "./KSLangSchema";
import { CodeGenerator } from "./CodeGenerator";
import { KsModelVisitor } from "./ModelVisitor";

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
            console.log(`[ClassRepository] Class not found: ${name}.`);
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

export class TypeInferer extends KsModelVisitor<Context> {
    constructor(public codeGen: CodeGenerator) { super(); }

    log(data: string) {
        console.log(`[TypeInferer] ${data}`);
    }

    protected visitIdentifier(id: ks.Identifier, context: Context) {
        id.valueType = context.variables.getType(id.text);
        //console.log(`Getting identifier: ${id.text} [${id.valueType.repr()}]`);
    }

    protected visitVariableDeclaration(stmt: ks.VariableDeclaration, context: Context) {
        super.visitVariableDeclaration(stmt, context);
        context.variables.add(stmt.variableName, stmt.initializer.valueType);
    }

    protected visitForStatement(stmt: ks.ForStatement, context: Context) {
        this.visitExpression(stmt.itemVariable.initializer, context);
        
        const newContext = context.inherit();
        newContext.variables.add(stmt.itemVariable.variableName,
            stmt.itemVariable.initializer.valueType);

        this.visitExpression(stmt.condition, newContext);
        this.visitExpression(stmt.incrementor, newContext);
        this.visitBlock(stmt.body, newContext);
    }

    protected visitForeachStatement(stmt: ks.ForeachStatement, context: Context) {
        this.visitExpression(stmt.items, context);
        
        const itemsType = stmt.items.valueType;
        if (!itemsType.isArray) {
            console.log(`Tried to use foreach on a non-array type: ${itemsType.repr()}!`);
            stmt.varType = ks.Type.Any;
        } else {
            stmt.varType = itemsType.typeArguments[0];
        }

        const newContext = context.inherit();
        newContext.variables.add(stmt.varName, stmt.varType);

        this.visitBlock(stmt.body, newContext);
    }

    protected visitBinaryExpression(expr: ks.BinaryExpression, context: Context) {
        super.visitBinaryExpression(expr, context);

        if (expr.left.valueType.typeKind === ks.TypeKind.Number && 
                expr.right.valueType.typeKind === ks.TypeKind.Number)
            expr.valueType.typeKind = ks.TypeKind.Number;
    }

    protected visitCallExpression(expr: ks.CallExpression, context: Context) {
        super.visitCallExpression(expr, context);

        if (expr.method.valueType.isMethod) {
            const cls = context.classes.getClass(expr.method.valueType.classType.className);
            const method = cls.getMethod(expr.method.valueType.methodName);
            expr.valueType = method.getReturnType();
        } else {
            this.log(`Tried to call a non-method type '${expr.method.valueType.repr()}'.`);
        }
}

    protected visitLiteral(expr: ks.Literal, context: Context) {
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
    }

    protected visitParenthesizedExpression(expr: ks.ParenthesizedExpression, context: Context) {
        super.visitParenthesizedExpression(expr, context);
        expr.valueType = expr.expression.valueType;
    }

    protected visitPropertyAccessExpression(expr: ks.PropertyAccessExpression, context: Context) {
        super.visitPropertyAccessExpression(expr, context);

        const objType = expr.object.valueType;
        if (objType.isClass) {
            const cls = context.classes.getClass(objType.className);
            const method = cls && cls.getMethod(expr.propertyName);
            if (method)
                expr.valueType = ks.Type.Method(objType, expr.propertyName);
        } else {
            this.log(`Cannot access property '${expr.propertyName}' on object type '${expr.object.valueType.repr()}'.`);
        }
    }

    protected visitArrayLiteral(expr: ks.ArrayLiteral, context: Context) {
        super.visitArrayLiteral(expr, context);

        let itemType = expr.items.length > 0 ? expr.items[0].valueType : ks.Type.Any;
        if (expr.items.some(x => !x.valueType.equals(itemType)))
            itemType = ks.Type.Any;

        expr.valueType = ks.Type.Array(itemType);
    }

    protected visitExpression(expression: ks.Expression, context: Context) {
        expression.valueType = new ks.Type();
        expression.valueType.typeKind = ks.TypeKind.Any;

        super.visitExpression(expression, context);
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
                this.visitBlock(method.body, methodContext);
            }
        }
    }
}
