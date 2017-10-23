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
    schemaCtx: SchemaContext;
    currClass: one.Class;
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

export class GenericsMapping {
    constructor(public map: { [genericName: string]: one.Type }) { }

    static log(data: string) { console.log(`[GenericsMapping] ${data}`); }

    static create(cls: one.Class, realClassType: one.Type) {
        if (cls.typeArguments.length !== realClassType.typeArguments.length) {
            this.log(`Type argument count mismatch! '${cls.type.repr()}' <=> '${realClassType.repr()}'`);
            return null;
        }

        const resolveDict = {};
        for (let i = 0; i < cls.typeArguments.length; i++)
            resolveDict[cls.typeArguments[i]] = realClassType.typeArguments[i];
        return new GenericsMapping(resolveDict);
    }

    replace(type: one.Type) {
        let newType = one.Type.Load(type);
        if (type.isGenerics) {
            const resolvedType = this.map[type.genericsName];
            if (!resolvedType)
                GenericsMapping.log(`Generics '${type.genericsName}' is not mapped. Mapped types: ${Object.keys(this.map).join(", ")}.`);
            else
                newType = one.Type.Load(resolvedType);
        }

        if (newType.isClass)
            for (let i = 0; i < newType.typeArguments.length; i++)
                newType.typeArguments[i] = this.replace(newType.typeArguments[i]);

        return newType;
    }
}

export class InferTypesTransform extends AstVisitor<Context> implements ISchemaTransform {
    name: string = "inferTypes";
    dependencies = ["fillName", "fillParent", "resolveIdentifiers"];

    protected visitIdentifier(id: one.Identifier, context: Context) {
        this.log(`No identifier should be here!`);
    }

    protected syncTypes(type1: one.Type, type2: one.Type) {
        if (!type1 || type1.isAny || type1.isGenerics) return type2;
        if (!type2 || type2.isAny || type2.isGenerics) return type1;

        const errorPrefix = `Cannot sync types (${type1.repr()} <=> ${type2.repr()})`;
        if (type1.typeKind !== type2.typeKind) {
            this.log(`${errorPrefix}: kind mismatch!`);
        } else if (type1.isClass) {
            if (type1.className !== type2.className) {
                this.log(`${errorPrefix}: class name mismatch!`);
            } else if (type1.typeArguments.length !== type2.typeArguments.length) {
                this.log(`${errorPrefix}: type argument length mismatch!`);
            } else {
                for (let i = 0; i < type1.typeArguments.length; i++)
                    type1.typeArguments[i] = type2.typeArguments[i] = 
                        this.syncTypes(type1.typeArguments[i], type2.typeArguments[i]);
            }
        }

        return type1;
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: Context) {
        super.visitVariableDeclaration(stmt, context);
        if (stmt.initializer)
            stmt.type = this.syncTypes(stmt.type, stmt.initializer.valueType);
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

        // TODO: really big hack... 
        if (expr.left.valueType.isNumber && expr.right.valueType.isNumber) 
            expr.valueType = one.Type.Class("OneNumber");
        else if (expr.left.valueType.isString) 
            expr.valueType = one.Type.Class("OneString");
    }

    protected visitConditionalExpression(expr: one.ConditionalExpression, context: Context) {
        super.visitConditionalExpression(expr, context);
        if (expr.whenTrue.valueType.equals(expr.whenFalse.valueType))
            expr.valueType = expr.whenTrue.valueType;
        else
            this.log(`Could not determine type of conditional expression. Type when true: ${expr.whenTrue.valueType.repr()}, when false: ${expr.whenFalse.valueType.repr()}`);
    }

    protected visitReturnStatement(stmt: one.ReturnStatement, context: Context) {
        super.visitReturnStatement(stmt, context);
    }

    protected visitUnaryExpression(expr: one.UnaryExpression, context: Context) {
        this.visitExpression(expr.operand, context);

        if (expr.operand.valueType.isNumber) 
            expr.valueType = one.Type.Class("OneNumber");
    }

    protected visitElementAccessExpression(expr: one.ElementAccessExpression, context: Context) {
        super.visitElementAccessExpression(expr, context);
        
        // TODO: use the return type of get() method
        const typeArgs = expr.object.valueType.typeArguments;
        if (typeArgs && typeArgs.length === 1)
            expr.valueType = expr.valueType || typeArgs[0];
    }

    protected visitCallExpression(expr: one.CallExpression, context: Context) {
        super.visitCallExpression(expr, context);

        if (!expr.method.valueType.isMethod) {
            this.log(`Tried to call a non-method type '${expr.method.valueType.repr()}'.`);
            return;
        }

        const className = expr.method.valueType.classType.className;
        const methodName = expr.method.valueType.methodName;
        const cls = context.classes.getClass(className);
        const method = cls.methods[methodName];
        if (!method) {
            this.log(`Method not found: ${className}::${methodName}`);
            return;
        }

        expr.valueType = one.Type.Load(method.returns);

        const thisExpr = (<one.MethodReference> expr.method).thisExpr;
        if (thisExpr) {
            const genMap = GenericsMapping.create(cls, thisExpr.valueType);
            if (genMap)
                expr.valueType = genMap.replace(expr.valueType);
        }
    }

    protected visitNewExpression(expr: one.NewExpression, context: Context) {
        super.visitNewExpression(expr, context);
        expr.valueType = one.Type.Load(expr.cls.valueType);
        expr.valueType.typeArguments = expr.typeArguments;
    }

    protected visitLiteral(expr: one.Literal, context: Context) {
        if (expr.valueType) return;

        if (expr.literalType === "numeric" || expr.literalType === "string" || expr.literalType === "boolean")
            expr.valueType = one.Type.Class(expr.literalClassName);
        else if (expr.literalType === "null")
            expr.valueType = one.Type.Any;
        else
            this.log(`Could not infer literal type: ${expr.literalType}`);
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
            const newValue = fieldOrProp.static ? one.VariableRef.StaticField(expr.object, fieldOrProp) :
                one.VariableRef.InstanceField(expr.object, fieldOrProp);
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

        expr.valueType = one.Type.Class(context.schemaCtx.arrayType, [itemType]);
    }

    protected visitMapLiteral(expr: one.MapLiteral, context: Context) {
        super.visitMapLiteral(expr, context);

        let itemType = expr.properties.length > 0 ? expr.properties[0].type : one.Type.Any;
        if (expr.properties.some(x => !x.type.equals(itemType)))
            itemType = one.Type.Any;

        expr.valueType = one.Type.Class(context.schemaCtx.mapType, [one.Type.Class("OneString"), itemType]);
    }

    protected visitExpression(expression: one.Expression, context: Context) {
        super.visitExpression(expression, context);
        if(!expression.valueType)
            expression.valueType = one.Type.Any;
    }

    protected visitClassReference(expr: one.ClassReference, context: Context) {
        expr.valueType = expr.classRef.type || expr.valueType;
    }
    
    protected visitThisReference(expr: one.ThisReference, context: Context) {
        expr.valueType = context.currClass.type || expr.valueType;
    }

    protected visitVariableRef(expr: one.VariableRef, context: Context) { 
        super.visitVariableRef(expr, context);
        expr.valueType = expr.varRef.type || expr.valueType;
    }
    
    protected visitMethodReference(expr: one.MethodReference, context: Context) {
        expr.valueType = expr.methodRef.type || expr.valueType;
    }

    protected visitMethod(method: one.Method, context: Context) { 
        method.type = one.Type.Method(method.classRef.type, method.name);
        super.visitMethod(method, context);
    } 
 
    protected visitClass(cls: one.Class, context: Context) {
        context.currClass = cls;
        cls.type = one.Type.Class(cls.name, cls.typeArguments.map(t => one.Type.Generics(t)));
        super.visitClass(cls, context);
    }

    transform(schemaCtx: SchemaContext) {
        const context = new Context();
        context.schemaCtx = schemaCtx;
        context.classes = schemaCtx.tiContext.classes;

        for (const cls of Object.values(schemaCtx.schema.classes))
            context.classes.addClass(cls);

        for (const cls of Object.values(schemaCtx.schema.classes)) { 
            this.visitClass(cls, context); 
        }
    }
}
