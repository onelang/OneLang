import { OneAst as one } from "./Ast";
import { AstVisitor } from "./AstVisitor";
import { VariableContext } from "./VariableContext";

export enum ReferenceType { Class, Method, MethodVariable, ClassVariable }

export class Reference {
    type: ReferenceType;
    className: string;
    methodName: string;
    variableName: string;
}

export class Context {
    variables: VariableContext<one.Type> = null;
    classes: ClassRepository = null;

    constructor(parent: Context = null) {
        this.variables = parent === null ? new VariableContext<one.Type>() : parent.variables.inherit();
        this.classes = parent === null ? new ClassRepository() : parent.classes;
    }

    inherit() {
        return new Context(this);
    }
}

export class ClassRepository {
    classes: { [name: string]: one.Class } = {};

    addClass(cls: one.Class) {
        this.classes[cls.name] = cls;
    }

    getClass(name: string) {
        const cls = this.classes[name];
        if (!cls)
            console.log(`[ClassRepository] Class not found: ${name}.`);
        return cls;
    }
}

export class TypeInferer extends AstVisitor<Context> {
    constructor(public schema: one.Schema, public overlaySchema: one.Schema = null) { super(); }

    log(data: string) {
        console.log(`[TypeInferer] ${data}`);
    }

    protected visitIdentifier(id: one.Identifier, context: Context) {
        id.valueType = context.variables.get(id.text);
        if (!id.valueType) {
            const cls = context.classes.getClass(id.text);
            if (cls)
                id.valueType = one.Type.Class(id.text);
        }

        if (!id.valueType) {
            this.log(`Could not find identifier: ${id.text}`);
            id.valueType = one.Type.Any;
        }
        //console.log(`Getting identifier: ${id.text} [${id.valueType.repr()}]`);
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: Context) {
        super.visitVariableDeclaration(stmt, context);
        context.variables.add(stmt.variableName, stmt.initializer.valueType);
    }

    protected visitForStatement(stmt: one.ForStatement, context: Context) {
        this.visitExpression(stmt.itemVariable.initializer, context);
        
        const newContext = context.inherit();
        newContext.variables.add(stmt.itemVariable.variableName,
            stmt.itemVariable.initializer.valueType);

        this.visitExpression(stmt.condition, newContext);
        this.visitExpression(stmt.incrementor, newContext);
        this.visitBlock(stmt.body, newContext);
    }

    protected visitForeachStatement(stmt: one.ForeachStatement, context: Context) {
        this.visitExpression(stmt.items, context);
        
        const itemsType = stmt.items.valueType;
        const itemsClass = context.classes.getClass(itemsType.className);
        
        if (!itemsClass || !itemsClass.meta.iteratable || itemsType.typeArguments.length === 0) {
            console.log(`Tried to use foreach on a non-array type: ${itemsType.repr()}!`);
            stmt.varType = one.Type.Any;
        } else {
            stmt.varType = itemsType.typeArguments[0];
        }

        const newContext = context.inherit();
        newContext.variables.add(stmt.varName, stmt.varType);

        this.visitBlock(stmt.body, newContext);
    }

    protected visitBinaryExpression(expr: one.BinaryExpression, context: Context) {
        super.visitBinaryExpression(expr, context);

        if (expr.left.valueType.typeKind === one.TypeKind.Number && 
                expr.right.valueType.typeKind === one.TypeKind.Number)
            expr.valueType.typeKind = one.TypeKind.Number;
    }

    protected visitCallExpression(expr: one.CallExpression, context: Context) {
        super.visitCallExpression(expr, context);

        if (expr.method.valueType.isMethod) {
            const className = expr.method.valueType.classType.className;
            const methodName = expr.method.valueType.methodName;
            const cls = context.classes.getClass(className);
            const method = cls.methods[methodName];
            if (!method)
                this.log(`Method not found: ${className}::${methodName}`);
            else
                expr.valueType = one.Type.Load(method.returns);
        } else {
            this.log(`Tried to call a non-method type '${expr.method.valueType.repr()}'.`);
        }
    }

    protected visitLiteral(expr: one.Literal, context: Context) {
        if (expr.literalType === "numeric")
            expr.valueType.typeKind = one.TypeKind.Number;
        else if (expr.literalType === "string")
            expr.valueType.typeKind = one.TypeKind.String;
        else if (expr.literalType === "boolean")
            expr.valueType.typeKind = one.TypeKind.Boolean;
        else if (expr.literalType === "null")
            expr.valueType.typeKind = one.TypeKind.Null;
        else
            this.log(`Could not inter literal type: ${expr.literalType}`);
    }

    protected visitParenthesizedExpression(expr: one.ParenthesizedExpression, context: Context) {
        super.visitParenthesizedExpression(expr, context);
        expr.valueType = expr.expression.valueType;
    }

    protected visitPropertyAccessExpression(expr: one.PropertyAccessExpression, context: Context) {
        super.visitPropertyAccessExpression(expr, context);

        const objType = expr.object.valueType;
        if (!objType.isClass) {
            this.log(`Cannot access property '${expr.propertyName}' on object type '${expr.object.valueType.repr()}'.`);
            return;
        }

        const cls = context.classes.getClass(objType.className);
        if (!cls) {
            this.log(`Class not found: ${objType.className}`);
            return;
        }

        const method = cls.methods[expr.propertyName];
        if (method) {
            expr.valueType = one.Type.Method(objType, expr.propertyName);
            return;
        }

        const fieldOrProp = cls.fields[expr.propertyName] || cls.properties[expr.propertyName];
        if (fieldOrProp) {
            expr.valueType = fieldOrProp.type;
            return;
        }

        this.log(`Member not found: ${objType.className}::${expr.propertyName}`);
    }

    protected visitArrayLiteral(expr: one.ArrayLiteral, context: Context) {
        super.visitArrayLiteral(expr, context);

        let itemType = expr.items.length > 0 ? expr.items[0].valueType : one.Type.Any;
        if (expr.items.some(x => !x.valueType.equals(itemType)))
            itemType = one.Type.Any;

        expr.valueType = one.Type.Class("TsArray", [itemType]);
    }

    protected visitExpression(expression: one.Expression, context: Context) {
        expression.valueType = new one.Type();
        expression.valueType.typeKind = one.TypeKind.Any;

        super.visitExpression(expression, context);
    }

    getTypeFromString(typeStr: string) {
        // TODO: serious hacks here
        if (typeStr === "int")
            return one.Type.Number;
        else {
            console.log(`getTypeFromString unknown type: ${typeStr}`);
            return one.Type.Any;
        }
    }

    getGlobalContext() {
        const context = new Context();
        //context.classes.add("Console");
        context.variables.add("console", one.Type.Class("Console"));
        return context;
    }

    process() {
        const globalContext = this.getGlobalContext();

        const classes = Object.values(this.schema.classes);

        for (const cls of classes)
            globalContext.classes.addClass(cls);
        
        if (this.overlaySchema) {
            for (const glob of Object.values(this.overlaySchema.globals))
                globalContext.variables.add(glob.variableName, glob.variableType);

            for (const cls of Object.values(this.overlaySchema.classes))
                globalContext.classes.addClass(cls);
        }
            
        for (const cls of classes) {
            const classContext = globalContext.inherit();
            classContext.variables.add("this", one.Type.Class(cls.name));
            for (const method of Object.values(cls.methods)) {
                const methodContext = classContext.inherit();
                for (const param of method.parameters)
                    methodContext.variables.add(param.name, one.Type.Load(param.type));
                this.visitBlock(method.body, methodContext);
            }
        }
    }
}
