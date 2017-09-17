import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { VariableContext } from "../VariableContext";
import { SchemaContext } from "../SchemaContext";
import { ISchemaTransform } from "../SchemaTransformer";

export enum ReferenceType { Class, Method, MethodVariable, ClassVariable }

export class Reference {
    type: ReferenceType;
    className: string;
    methodName: string;
    variableName: string;
}

export class TiContext {
    variables: VariableContext = null;
    classes: ClassRepository = null;

    constructor(parent: TiContext = null) {
        this.variables = parent === null ? new VariableContext() : parent.variables.inherit();
        this.classes = parent === null ? new ClassRepository() : parent.classes;
    }

    inherit() {
        return new TiContext(this);
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

export class InferTypesTransform extends AstVisitor<TiContext> implements ISchemaTransform {
    name: string = "inferTypes";
    dependencies = ["fillName"];

    protected visitIdentifier(id: one.Identifier, context: TiContext) {
        const variable = context.variables.get(id.text);
        if (variable) {
            id.valueType = variable.type;
            if (!id.valueType)
                this.log(`Variable type is missing: ${variable.metaPath}`);
        } else {
            const cls = context.classes.getClass(id.text);
            if (cls)
                id.valueType = one.Type.Class(id.text);
        }

        if (!id.valueType) {
            this.log(`Could not find identifier's type: ${id.text}`);
            id.valueType = one.Type.Any;
        }
        //console.log(`Getting identifier: ${id.text} [${id.valueType.repr()}]`);
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: TiContext) {
        super.visitVariableDeclaration(stmt, context);
        stmt.type = stmt.initializer.valueType;
        context.variables.add(stmt);
    }

    protected visitForStatement(stmt: one.ForStatement, context: TiContext) {
        this.visitExpression(stmt.itemVariable.initializer, context);
        stmt.itemVariable.type = stmt.itemVariable.initializer.valueType;
        
        const newContext = context.inherit();
        newContext.variables.add(stmt.itemVariable);

        this.visitExpression(stmt.condition, newContext);
        this.visitExpression(stmt.incrementor, newContext);
        this.visitBlock(stmt.body, newContext);
    }

    protected visitForeachStatement(stmt: one.ForeachStatement, context: TiContext) {
        this.visitExpression(stmt.items, context);
        
        const itemsType = stmt.items.valueType;
        const itemsClass = context.classes.getClass(itemsType.className);
        
        if (!itemsClass || !itemsClass.meta.iterable || itemsType.typeArguments.length === 0) {
            console.log(`Tried to use foreach on a non-array type: ${itemsType.repr()}!`);
            stmt.itemVariable.type = one.Type.Any;
        } else {
            stmt.itemVariable.type = itemsType.typeArguments[0];
        }

        const newContext = context.inherit();
        newContext.variables.add(stmt.itemVariable);

        this.visitBlock(stmt.body, newContext);
    }

    protected visitBinaryExpression(expr: one.BinaryExpression, context: TiContext) {
        super.visitBinaryExpression(expr, context);

        if (expr.left.valueType.typeKind === one.TypeKind.Number && 
                expr.right.valueType.typeKind === one.TypeKind.Number)
            expr.valueType = one.Type.Number;
    }

    protected visitCallExpression(expr: one.CallExpression, context: TiContext) {
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

    protected visitNewExpression(expr: one.NewExpression, context: TiContext) {
        super.visitNewExpression(expr, context);
        expr.valueType = expr.class.valueType;
    }

    protected visitLiteral(expr: one.Literal, context: TiContext) {
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

    protected visitParenthesizedExpression(expr: one.ParenthesizedExpression, context: TiContext) {
        super.visitParenthesizedExpression(expr, context);
        expr.valueType = expr.expression.valueType;
    }

    protected visitPropertyAccessExpression(expr: one.PropertyAccessExpression, context: TiContext) {
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

    protected visitArrayLiteral(expr: one.ArrayLiteral, context: TiContext) {
        super.visitArrayLiteral(expr, context);

        let itemType = expr.items.length > 0 ? expr.items[0].valueType : one.Type.Any;
        if (expr.items.some(x => !x.valueType.equals(itemType)))
            itemType = one.Type.Any;

        expr.valueType = one.Type.Class("TsArray", [itemType]);
    }

    protected visitExpression(expression: one.Expression, context: TiContext) {
        super.visitExpression(expression, context);
        if(!expression.valueType)
            expression.valueType = one.Type.Any;
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
        const globalContext = schemaCtx.tiContext.inherit();

        const classes = Object.values(schemaCtx.schema.classes);

        for (const cls of classes)
            globalContext.classes.addClass(cls);
        
        for (const cls of classes) {
            const classContext = globalContext.inherit();
            classContext.variables.add(<one.VariableBase> { name: "this", type: one.Type.Class(cls.name) });
            for (const method of Object.values(cls.methods)) {
                const methodContext = classContext.inherit();
                for (const param of method.parameters)
                    methodContext.variables.add(param);
                this.visitBlock(method.body, methodContext);
            }
        }
    }
}
