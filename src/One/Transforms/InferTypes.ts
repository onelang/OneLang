import { AstTransformer } from "../AstTransformer";
import { ErrorManager } from "../ErrorManager";
import { PropertyAccessExpression, Expression, CastExpression } from "../Ast/Expressions";
import { ClassReference, StaticFieldReference, StaticPropertyReference, StaticMethodReference, SuperReference, ThisReference, ForeachVariableReference, ForVariableReference, VariableDeclarationReference, InstanceFieldReference, InstancePropertyReference, InstanceMethodReference, MethodParameterReference, EnumReference, EnumMemberReference } from "../Ast/References";
import { SourceFile, Class, Method } from "../Ast/Types";
import { ClassType, InterfaceType, AnyType } from "../Ast/AstTypes";

export class InferTypes extends AstTransformer<void> {
    currentMethod: Method;
    processedNodes = new Set<any>();

    constructor(public errorMan = new ErrorManager()) { super(); }

    protected getStaticRef(cls: Class, memberName: string) {
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

    protected getInstanceRef(cls: Class, memberName: string, obj: Expression) {
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
        } else if (
            expr.object instanceof ForeachVariableReference ||
            expr.object instanceof ForVariableReference ||
            expr.object instanceof MethodParameterReference ||
            expr.object instanceof VariableDeclarationReference) {
                const type = expr.object.decl.type;
                if (type instanceof ClassType) {
                    return this.getInstanceRef(type.decl, expr.propertyName, expr.object);
                } else if (type instanceof InterfaceType) {
                    // TODO: implement "if (interfaceVarName instanceof SpecificClass) { ...interfaceVarName is now type of SpecificClass... }"
                    return null;
                } else if (!type) {
                    return this.errorMan.throw(`Var type was not inferred yet (var="${expr.object.decl.name}", prop="${expr.propertyName}")`);
                } else if (type instanceof AnyType) {
                    return this.errorMan.throw(`Var has any type (var="${expr.object.decl.name}", prop="${expr.propertyName}")`);
                } else {
                    return this.errorMan.throw(`Expected class as variable type, but got: ${type.constructor.name} (prop="${expr.propertyName}")`);
                }
        }

        return this.errorMan.throw(`Could not resolve property access: obj=${expr.object.constructor.name}, prop="${expr.propertyName}"`);
    }

    protected visitExpression(expr: Expression): Expression {
        super.visitExpression(expr);

        if (expr instanceof PropertyAccessExpression)
            return this.inferPropertyAccess(expr);
        else if (expr instanceof CastExpression) {

        }

        return null;
    }

    protected visitMethod(method: Method) {
        this.currentMethod = method;
        super.visitMethod(method);
        this.currentMethod = null;
    }


    public visitSourceFile(sourceFile: SourceFile) {
        this.errorMan.resetContext("ResolveUnresolvedTypes", sourceFile);
        super.visitSourceFile(sourceFile);
        this.errorMan.resetContext();
    }
}