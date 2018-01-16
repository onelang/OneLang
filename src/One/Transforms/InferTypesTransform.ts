import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { VariableContext } from "../VariableContext";
import { SchemaContext } from "../SchemaContext";
import { ISchemaTransform } from "../SchemaTransformer";
import { AstHelper } from "../AstHelper";
import { AstTransformer } from "../AstTransformer";

export enum ReferenceType { Class, Method, MethodVariable, ClassVariable }

export class Reference {
    type: ReferenceType;
    className: string;
    methodName: string;
    variableName: string;
}

export class GenericsMapping {
    constructor(public map: { [genericName: string]: one.Type }) { }

    static log(data: string) { console.log(`[GenericsMapping] ${data}`); }

    static create(cls: one.Interface, realClassType: one.Type) {
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

        if (newType.isClassOrInterface)
            for (let i = 0; i < newType.typeArguments.length; i++)
                newType.typeArguments[i] = this.replace(newType.typeArguments[i]);

        return newType;
    }
}

export class InferTypesTransform extends AstTransformer<void> {
    constructor(public schemaCtx: SchemaContext) { super(); }

    protected visitType(type: one.Type) {
        super.visitType(type, null);
        if (!type) return;

        if (type.isClass && this.schemaCtx.getInterface(type.className))
            type.typeKind = one.TypeKind.Interface;
    }

    protected visitIdentifier(id: one.Identifier) {
        this.log(`No identifier should be here!`);
    }

    protected visitTemplateString(expr: one.TemplateString) {
        super.visitTemplateString(expr, null);
        expr.valueType = one.Type.Class("OneString");
    }
    
    protected syncTypes(type1: one.Type, type2: one.Type) {
        if (!type1 || type1.isAny || type1.isGenerics) return type2;
        if (!type2 || type2.isAny || type2.isGenerics) return type1;

        const errorPrefix = `Cannot sync types (${type1.repr()} <=> ${type2.repr()})`;
        if (type1.typeKind !== type2.typeKind) {
            this.log(`${errorPrefix}: kind mismatch!`);
        } else if (type1.isClassOrInterface) {
            if (type1.className !== type2.className) {
                this.log(`${errorPrefix}: class name mismatch!`);
            } else if (type1.typeArguments.length !== type2.typeArguments.length) {
                this.log(`${errorPrefix}: type argument length mismatch!`);
            } else {
                type1.typeKind = type2.typeKind; // class -> interface if needed
                for (let i = 0; i < type1.typeArguments.length; i++)
                    type1.typeArguments[i] = type2.typeArguments[i] = 
                        this.syncTypes(type1.typeArguments[i], type2.typeArguments[i]);
            }
        }

        return type1;
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration) {
        super.visitVariableDeclaration(stmt, null);
        if (stmt.initializer)
            stmt.type = this.syncTypes(stmt.type, stmt.initializer.valueType);
    }

    protected visitCastExpression(expr: one.CastExpression) {
        expr.expression.valueType = expr.newType;
        AstHelper.replaceProperties(expr, expr.expression);
        this.visitExpression(expr);
    }

    protected visitForeachStatement(stmt: one.ForeachStatement) {
        this.visitExpression(stmt.items);
        
        const itemsType = stmt.items.valueType;
        const itemsClass = this.schemaCtx.getClass(itemsType.className);
        
        if (!itemsClass || !itemsClass.meta.iterable || itemsType.typeArguments.length === 0) {
            console.log(`Tried to use foreach on a non-array type: ${itemsType.repr()}!`);
            stmt.itemVariable.type = one.Type.Any;
        } else {
            stmt.itemVariable.type = itemsType.typeArguments[0];
        }

        this.visitBlock(stmt.body, null);
    }

    protected visitBinaryExpression(expr: one.BinaryExpression) {
        super.visitBinaryExpression(expr, null);

        // TODO: really big hack... 
        if (["<=", ">=", "===", "==", "!==", "!="].includes(expr.operator))
            expr.valueType = one.Type.Class("OneBoolean");
        else if (expr.left.valueType.isNumber && expr.right.valueType.isNumber)
            expr.valueType = one.Type.Class("OneNumber");
        else if (expr.left.valueType.isBoolean && expr.right.valueType.isBoolean)
            expr.valueType = one.Type.Class("OneBoolean");
        else if (expr.left.valueType.isString) 
            expr.valueType = one.Type.Class("OneString");
    }

    protected visitConditionalExpression(expr: one.ConditionalExpression) {
        super.visitConditionalExpression(expr, null);
        
        const trueType = expr.whenTrue.valueType;
        const falseType = expr.whenFalse.valueType;
        if (trueType.equals(falseType)) {
            expr.valueType = trueType;
        } else if (trueType.isNull && !falseType.isNull) {
            expr.valueType = falseType;
        } else if (!trueType.isNull && falseType.isNull) {
            expr.valueType = trueType;
        } else {
            if (trueType.isClassOrInterface && falseType.isClassOrInterface) {
                expr.valueType = this.schemaCtx.findBaseClass(trueType.className, falseType.className);
                if (expr.valueType) return;
            }

            this.log(`Could not determine type of conditional expression. Type when true: ${trueType.repr()}, when false: ${falseType.repr()}`);
        }
    }

    protected visitReturnStatement(stmt: one.ReturnStatement) {
        super.visitReturnStatement(stmt, null);
    }

    protected visitUnaryExpression(expr: one.UnaryExpression) {
        this.visitExpression(expr.operand);

        if (expr.operand.valueType.isNumber) 
            expr.valueType = one.Type.Class("OneNumber");
    }

    protected visitElementAccessExpression(expr: one.ElementAccessExpression) {
        super.visitElementAccessExpression(expr, null);
        
        // TODO: use the return type of get() method
        const typeArgs = expr.object.valueType.typeArguments;
        if (typeArgs && typeArgs.length === 1)
            expr.valueType = expr.valueType || typeArgs[0];
    }

    protected visitCallExpression(expr: one.CallExpression) {
        super.visitCallExpression(expr, null);

        if (!expr.method.valueType.isMethod) {
            this.log(`Tried to call a non-method type '${expr.method.valueType.repr()}'`);
            return;
        }

        const className = expr.method.valueType.classType.className;
        const methodName = expr.method.valueType.methodName;
        const cls = this.schemaCtx.getClassOrInterface(className, true);
        const method = this.schemaCtx.getMethod(className, methodName);
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

    protected visitNewExpression(expr: one.NewExpression) {
        super.visitNewExpression(expr, null);
        expr.valueType = one.Type.Load(expr.cls.valueType);
        expr.valueType.typeArguments = expr.typeArguments;
    }

    protected visitLiteral(expr: one.Literal) {
        if (expr.valueType) return;

        if (expr.literalType === "numeric" || expr.literalType === "string" || expr.literalType === "boolean" || expr.literalType === "character")
            expr.valueType = one.Type.Class(this.schema.langData.literalClassNames[expr.literalType]);
        else if (expr.literalType === "null")
            expr.valueType = one.Type.Null;
        else
            this.log(`Could not infer literal type: ${expr.literalType}`);
    }

    protected visitParenthesizedExpression(expr: one.ParenthesizedExpression) {
        super.visitParenthesizedExpression(expr, null);
        expr.valueType = expr.expression.valueType;
    }

    protected visitPropertyAccessExpression(expr: one.PropertyAccessExpression) {
        super.visitPropertyAccessExpression(expr, null);

        const objType = expr.object.valueType;
        if (objType.isEnum) {
            const enum_ = this.schemaCtx.schema.enums[objType.enumName];
            if (!enum_) {
                this.log(`Enum not found: ${objType.enumName}`);
                return;
            }

            const enumMember = enum_.values.find(x => x.name === expr.propertyName);
            if (!enumMember) {
                this.log(`Enum member '${expr.propertyName}' not found in enum '${objType.enumName}'`);
                return;
            }

            const newValue = new one.EnumMemberReference(enumMember, enum_);
            const newExpr = AstHelper.replaceProperties(expr, newValue);
            newExpr.valueType = objType;
            return;
        }

        if (!objType.isClassOrInterface) {
            this.log(`Cannot access property '${expr.propertyName}' on object type '${expr.object.valueType.repr()}'.`);
            return;
        }

        const method = this.schemaCtx.getMethod(objType.className, expr.propertyName);
        if (method) {
            const thisIsStatic = expr.object.exprKind === one.ExpressionKind.ClassReference;
            const thisIsThis = expr.object.exprKind === one.ExpressionKind.ThisReference;
    
            if (method.static && !thisIsStatic)
                this.log("Tried to call static method via instance reference");
            else if (!method.static && thisIsStatic)
                this.log("Tried to call non-static method via static reference");
    
            const newValue = new one.MethodReference(method, thisIsStatic ? null : expr.object);
            const newExpr = AstHelper.replaceProperties(expr, newValue);
            newExpr.valueType = one.Type.Method(objType, method.name);
            return;
        }

        const fieldOrProp = this.schemaCtx.getFieldOrProp(objType.className, expr.propertyName);
        if (fieldOrProp) {
            const newValue = fieldOrProp.static ? one.VariableRef.StaticField(expr.object, fieldOrProp) :
                one.VariableRef.InstanceField(expr.object, fieldOrProp);
            const newExpr = AstHelper.replaceProperties(expr, newValue);
            newExpr.valueType = fieldOrProp.type;
            return;
        }

        this.log(`Member not found: ${objType.className}::${expr.propertyName}`);
    }

    protected visitArrayLiteral(expr: one.ArrayLiteral) {
        super.visitArrayLiteral(expr, null);

        let itemType = expr.items.length > 0 ? expr.items[0].valueType : one.Type.Any;
        if (expr.items.some(x => !x.valueType.equals(itemType)))
            itemType = one.Type.Any;

        expr.valueType = expr.valueType || one.Type.Class(this.schemaCtx.arrayType, [itemType]);
    }

    protected visitMapLiteral(expr: one.MapLiteral) {
        super.visitMapLiteral(expr, null);

        let itemType = expr.properties.length > 0 ? expr.properties[0].type : one.Type.Any;
        if (expr.properties.some(x => !x.type.equals(itemType)))
            itemType = one.Type.Any;

        expr.valueType = one.Type.Class(this.schemaCtx.mapType, [one.Type.Class("OneString"), itemType]);
    }

    protected visitExpression(expression: one.Expression) {
        super.visitExpression(expression, null);
        if(!expression.valueType)
            expression.valueType = one.Type.Any;
    }

    protected visitClassReference(expr: one.ClassReference) {
        expr.valueType = expr.classRef.type || expr.valueType;
    }
    
    protected visitEnumReference(expr: one.EnumReference) {
        expr.valueType = expr.enumRef.type || expr.valueType;
    }
    
    protected visitThisReference(expr: one.ThisReference) {
        expr.valueType = this.currentClass.type || expr.valueType;
    }

    protected visitVariableRef(expr: one.VariableRef) { 
        super.visitVariableRef(expr, null);
        expr.valueType = expr.varRef.type || expr.valueType;
    }
    
    protected visitMethodReference(expr: one.MethodReference) {
        expr.valueType = expr.methodRef.type || expr.valueType;
    }

    protected visitMethod(method: one.Method) { 
        method.type = one.Type.Method(method.classRef.type, method.name);
        super.visitMethod(method, null);
    } 
 
    protected visitClass(cls: one.Class) {
        cls.type = one.Type.Class(cls.name, cls.typeArguments.map(t => one.Type.Generics(t)));
        super.visitClass(cls, null);
    }

    protected visitInterface(intf: one.Interface) {
        intf.type = one.Type.Interface(intf.name, intf.typeArguments.map(t => one.Type.Generics(t)));
        super.visitInterface(intf, null);
    }

    protected visitEnum(enum_: one.Enum) {
        enum_.type = one.Type.Enum(enum_.name);
        super.visitEnum(enum_, null);
    }

    transform() {
        this.visitSchema(this.schemaCtx.schema, null);
    }
}
