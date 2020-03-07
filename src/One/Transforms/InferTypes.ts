import { AstTransformer } from "../AstTransformer";
import { ErrorManager } from "../ErrorManager";
import { PropertyAccessExpression, Expression, CastExpression, ParenthesizedExpression, BinaryExpression, StringLiteral, UnresolvedCallExpression, StaticMethodCallExpression, InstanceMethodCallExpression, ConditionalExpression, InstanceOfExpression } from "../Ast/Expressions";
import { ClassReference, StaticFieldReference, StaticPropertyReference, StaticMethodReference, SuperReference, ThisReference, ForeachVariableReference, ForVariableReference, VariableDeclarationReference, InstanceFieldReference, InstancePropertyReference, InstanceMethodReference, MethodParameterReference, EnumReference, EnumMemberReference, Reference } from "../Ast/References";
import { SourceFile, Class, Method } from "../Ast/Types";
import { ClassType, InterfaceType, AnyType, Type } from "../Ast/AstTypes";

export class InferTypes extends AstTransformer<void> {
    currentMethod: Method;
    processedNodes = new Set<any>();
    file: SourceFile;

    constructor(public errorMan = new ErrorManager()) { super(); }

    protected getStaticRef(cls: Class, memberName: string): Reference {
        const field = cls.fields.get(memberName);
        if (field && field.isStatic)
            return new StaticFieldReference(field);

        const prop = cls.properties.get(memberName);
        if (prop && prop.isStatic)
            return new StaticPropertyReference(prop);

        const method = cls.methods.get(memberName);
        if (method && method.isStatic)
            return new StaticMethodReference(method);

        return this.errorMan.throw(`Could not resolve static member access of a class: ${cls.name}::${memberName}`);
    }

    protected getInstanceRef(cls: Class, memberName: string, obj: Expression): Reference {
        const field = cls.fields.get(memberName);
        if (field && !field.isStatic)
            return new InstanceFieldReference(obj, field);

        const prop = cls.properties.get(memberName);
        if (prop && !prop.isStatic)
            return new InstancePropertyReference(obj, prop);

        const method = cls.methods.get(memberName);
        if (method && !method.isStatic)
            return new InstanceMethodReference(obj, method);

        this.errorMan.throw(`Could not resolve instance member access of a class: ${cls.name}::${memberName}`);
    }

    protected inferPropertyAccess(expr: PropertyAccessExpression): Expression {
        if (expr.object instanceof EnumReference) {
            const member = expr.object.decl.values.get(expr.propertyName);
            if (!member)
                return this.errorMan.throw(`Enum member was not found: ${expr.object.decl.name}::${expr.propertyName}`);
            return new EnumMemberReference(member);
        }

        if (expr.object instanceof ClassReference)
            return this.getStaticRef(expr.object.decl, expr.propertyName);

        if (expr.object instanceof ThisReference && this.currentMethod && this.currentMethod.isStatic)
            return this.getStaticRef(expr.object.cls, expr.propertyName);

        if (expr.object instanceof SuperReference ||
            expr.object instanceof ThisReference) {
                return this.getInstanceRef(expr.object.cls, expr.propertyName, expr.object);
        }

        const type = expr.object.exprType;
        if (type instanceof ClassType) {
            return this.getInstanceRef(type.decl, expr.propertyName, expr.object);
        } else if (type instanceof InterfaceType) {
            // TODO: implement "if (interfaceVarName instanceof SpecificClass) { ...interfaceVarName is now type of SpecificClass... }"
            return this.errorMan.throw(`InterfaceType is not implemented yet`);
        } else if (!type) {
            return this.errorMan.throw(`Type was not inferred yet (prop="${expr.propertyName}")`);
        } else if (type instanceof AnyType) {
            return this.errorMan.throw(`Object has any type (prop="${expr.propertyName}")`);
        } else {
            return this.errorMan.throw(`Expected class as variable type, but got: ${type.constructor.name} (prop="${expr.propertyName}")`);
        }
    }

    protected visitExpression(expr: Expression): Expression {
        super.visitExpression(expr);

        if (expr instanceof PropertyAccessExpression)
            expr = this.inferPropertyAccess(expr);
        
        if (expr instanceof UnresolvedCallExpression) {
            if (expr.method instanceof StaticMethodReference)
                expr = new StaticMethodCallExpression(expr.method.decl, expr.typeArgs, expr.args);
            else if (expr.method instanceof InstanceMethodReference)
                expr = new InstanceMethodCallExpression(expr.method.object, expr.method.method, expr.typeArgs, expr.args);
            else
                throw new Error("Invalid method call!");
        }

        if (expr.exprType) {
        } else if (expr instanceof CastExpression) {
            expr.setType(expr.newType);
        } else if (expr instanceof ParenthesizedExpression) {
            expr.setType(expr.expression.exprType);
        } else if (expr instanceof ThisReference) {
            expr.setType(expr.cls.type);
        } else if (expr instanceof MethodParameterReference) {
            expr.setType(expr.decl.type);
        } else if (expr instanceof InstanceFieldReference) {
            expr.setType(expr.field.type);
        } else if (expr instanceof InstancePropertyReference) {
            expr.setType(expr.property.type);
        } else if (expr instanceof StringLiteral) {
        } else if (expr instanceof InstanceMethodReference) {
        } else if (expr instanceof InstanceOfExpression) {
            expr.setType(this.file.literalTypes.boolean);
        } else if (expr instanceof InstanceMethodCallExpression) {
            expr.setType(expr.method.returns);
        } else if (expr instanceof BinaryExpression) {
            const leftType = expr.left.exprType;
            const rightType = expr.right.exprType;
            if (expr.operator === "=") {
                if (Type.equals(leftType, rightType))
                    expr.setType(leftType);
                else
                    throw new Error("Different types on the left and right-side of the assignment.");
            } else if (leftType instanceof ClassType && rightType instanceof ClassType) {
                const opId = `${leftType.decl.name} ${expr.operator} ${rightType.decl.name}`;

                if (opId === "TsBoolean && TsBoolean")
                    expr.setType(this.file.literalTypes.boolean);
                else {
                    debugger;
                }
            }
        } else if (expr instanceof ConditionalExpression) {
            if (Type.equals(expr.whenTrue.exprType, expr.whenFalse.exprType))
                expr.setType(expr.whenTrue.exprType);
            else
                throw new Error("Different types in the whenTrue and whenFalse expressions of a conditional expression");
        } else {
            debugger;
        }

        return expr;
    }

    protected visitMethod(method: Method) {
        this.currentMethod = method;
        super.visitMethod(method);
        this.currentMethod = null;
    }


    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;
        this.errorMan.resetContext("ResolveUnresolvedTypes", sourceFile);
        super.visitSourceFile(sourceFile);
        this.errorMan.resetContext();
    }
}