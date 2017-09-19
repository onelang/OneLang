import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { VariableContext } from "../VariableContext";
import { SchemaContext } from "../SchemaContext";
import { ISchemaTransform } from "../SchemaTransformer";
import { AstHelper } from "../AstHelper";

export enum ReferenceType { Class, Method, MethodVariable, ClassVariable }

export class Reference {
    type: ReferenceType;
    className: string;
    methodName: string;
    variableName: string;
}

export class Context {
    currClassType: one.Type;
    classes: ClassRepository = null;

    constructor(parent: Context = null) {
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

export class InferTypesTransform extends AstVisitor<Context> implements ISchemaTransform {
    name: string = "inferTypes";
    dependencies = ["fillName", "fillParent", "resolveIdentifiers"];

    protected visitIdentifier(id: one.Identifier, context: Context) {
        console.log(`No identifier should be here!`);
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: Context) {
        super.visitVariableDeclaration(stmt, context);
        if (stmt.initializer)
            stmt.type = stmt.initializer.valueType;
    }

    protected visitForeachStatement(stmt: one.ForeachStatement, context: Context) {
        this.visitExpression(stmt.items, context);
        
        const itemsType = stmt.items.valueType;
        const itemsClass = context.classes.getClass(itemsType.className);
        
        if (!itemsClass || !itemsClass.meta.iterable || itemsType.typeArguments.length === 0) {
            console.log(`Tried to use foreach on a non-array type: ${itemsType.repr()}!`);
            stmt.itemVariable.type = one.Type.Any;
        } else {
            stmt.itemVariable.type = itemsType.typeArguments[0];
        }

        this.visitBlock(stmt.body, context);
    }

    protected visitBinaryExpression(expr: one.BinaryExpression, context: Context) {
        super.visitBinaryExpression(expr, context);

        if (expr.left.valueType.isNumber && expr.right.valueType.isNumber)
            expr.valueType = one.Type.Number;
    }

    protected visitUnaryExpression(expr: one.UnaryExpression, context: Context) {
        this.visitExpression(expr.operand, context);

        if (expr.operand.valueType.isNumber)
            expr.valueType = one.Type.Number;
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

    protected visitNewExpression(expr: one.NewExpression, context: Context) {
        super.visitNewExpression(expr, context);
        expr.valueType = expr.cls.valueType;
    }

    protected visitLiteral(expr: one.Literal, context: Context) {
        if (expr.literalType === "numeric")
            expr.valueType = one.Type.Number;
        else if (expr.literalType === "string")
            expr.valueType = one.Type.String;
        else if (expr.literalType === "boolean")
            expr.valueType = one.Type.Boolean;
        else if (expr.literalType === "null")
            expr.valueType = one.Type.Null;
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

        const thisIsStatic = expr.object.exprKind === one.ExpressionKind.ClassReference;
        const thisIsThis = expr.object.exprKind === one.ExpressionKind.ThisReference;

        const method = cls.methods[expr.propertyName];
        if (method) {
            if (method.static && !thisIsStatic)
                this.log("Tried to call static method via instance reference");
            else if (!method.static && thisIsStatic)
                this.log("Tried to call non-static method via static reference");

            const newValue = new one.MethodReference(method, thisIsStatic ? null : expr.object);
            const newExpr = AstHelper.replaceProperties(expr, newValue);
            newExpr.valueType = one.Type.Method(objType, method.name);
            return;
        }

        const fieldOrProp = cls.fields[expr.propertyName] || cls.properties[expr.propertyName];
        if (fieldOrProp) {
            const newValue = one.VariableRef.InstanceField(expr.object, fieldOrProp);
            const newExpr = AstHelper.replaceProperties(expr, newValue);
            newExpr.valueType = fieldOrProp.type;
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
        super.visitExpression(expression, context);
        if(!expression.valueType)
            expression.valueType = one.Type.Any;
    }

    protected visitClassReference(expr: one.ClassReference, context: Context) {
        expr.valueType = expr.classRef.type;
    }
    
    protected visitThisReference(expr: one.ThisReference, context: Context) {
        expr.valueType = context.currClassType;
    }

    protected visitVariableRef(expr: one.VariableRef, context: Context) { 
        expr.valueType = expr.varRef.type;
    }
    
    protected visitMethodReference(expr: one.MethodReference, context: Context) {
        expr.valueType = expr.methodRef.type;
    }

    protected visitMethod(method: one.Method, context: Context) { 
        method.type = one.Type.Method(method.parentRef.type, method.name);
        super.visitMethod(method, context);
    } 
 
    protected visitClass(cls: one.Class, context: Context) {
        // TODO: type arguments?
        cls.type = one.Type.Class(cls.name);
        super.visitClass(cls, context);
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

    transform(schemaCtx: SchemaContext) {
        const context = new Context();
        context.classes = schemaCtx.tiContext.classes;

        for (const cls of Object.values(schemaCtx.schema.classes))
            context.classes.addClass(cls);

        for (const cls of Object.values(schemaCtx.schema.classes)) { 
            context.currClassType = one.Type.Class(cls.name);
            this.visitClass(cls, context); 
        }
    }
}
