import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, PropertyAccessExpression, UnresolvedCallExpression } from "../../Ast/Expressions";
import { ClassReference, Reference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, ThisReference, SuperReference, EnumReference } from "../../Ast/References";
import { Class, Method, Interface } from "../../Ast/Types";
import { ClassType, InterfaceType, AnyType } from "../../Ast/AstTypes";
import { GenericsResolver } from "./Helpers/GenericsResolver";

export class ResolveFieldAndPropertyAccess extends InferTypesPlugin {
    name = "ResolveFieldAndPropertyAccess";

    protected getStaticRef(cls: Class, memberName: string): Reference {
        const field = cls.fields.find(x => x.name === memberName);
        if (field && field.isStatic)
            return new StaticFieldReference(field);

        const prop = cls.properties.find(x => x.name === memberName);
        if (prop && prop.isStatic)
            return new StaticPropertyReference(prop);

        this.errorMan.throw(`Could not resolve static member access of a class: ${cls.name}::${memberName}`);
        return null;
    }

    protected getInstanceRef(cls: Class, memberName: string, obj: Expression): Reference {
        while (true) {
            const field = cls.fields.find(x => x.name === memberName) || null;
            if (field !== null && !field.isStatic)
                return new InstanceFieldReference(obj, field);
    
            const prop = cls.properties.find(x => x.name === memberName) || null;
            if (prop !== null && !prop.isStatic)
                return new InstancePropertyReference(obj, prop);
    
            if (cls.baseClass === null)
                break;

            cls = (<ClassType>cls.baseClass).decl;
        }

        this.errorMan.throw(`Could not resolve instance member access of a class: ${cls.name}::${memberName}`);
        return null;
    }

    protected getInterfaceRef(intf: Interface, memberName: string, obj: Expression): Reference {
        const field = intf.fields.find(x => x.name === memberName) || null;
        if (field !== null && !field.isStatic)
            return new InstanceFieldReference(obj, field);

        for (const baseIntf of intf.baseInterfaces) {
            const res = this.getInterfaceRef((<InterfaceType>baseIntf).decl, memberName, obj);
            if (res !== null)
                return res;
        }
        return null;
    }

    protected transformPA(expr: PropertyAccessExpression): Expression {
        if (expr.object instanceof ClassReference)
            return this.getStaticRef(expr.object.decl, expr.propertyName);

        expr.object = this.main.visitExpression(expr.object);

        if (expr.object instanceof ThisReference && this.main.currentMethod instanceof Method && this.main.currentMethod.isStatic)
            return this.getStaticRef(expr.object.cls, expr.propertyName);

        if (expr.object instanceof ThisReference)
            return this.getInstanceRef(expr.object.cls, expr.propertyName, expr.object);

        const type = expr.object.getType();
        if (type instanceof ClassType) {
            return this.getInstanceRef(type.decl, expr.propertyName, expr.object);
        } else if (type instanceof InterfaceType) {
            const ref = this.getInterfaceRef(type.decl, expr.propertyName, expr.object);
            if (ref === null)
                this.errorMan.throw(`Could not resolve instance member access of a interface: ${type.repr()}::${expr.propertyName}`);
            return ref;
        } else if (!type) {
            this.errorMan.throw(`Type was not inferred yet (prop="${expr.propertyName}")`);
        } else if (type instanceof AnyType) {
            this.errorMan.throw(`Object has any type (prop="${expr.propertyName}")`);
        } else {
            this.errorMan.throw(`Expected class as variable type, but got: ${type.constructor.name} (prop="${expr.propertyName}")`);
        }

        return null;
    }

    canTransform(expr: Expression) { return expr instanceof PropertyAccessExpression &&
        !(expr.object instanceof EnumReference) &&
        !(expr.parentNode instanceof UnresolvedCallExpression && expr.parentNode.func === expr); }

    transform(expr: Expression): Expression {
        return this.transformPA(<PropertyAccessExpression> expr);
    }

    canDetectType(expr: Expression) { 
        return expr instanceof InstanceFieldReference || expr instanceof InstancePropertyReference ||
            expr instanceof StaticFieldReference || expr instanceof StaticPropertyReference;
    }

    detectType(expr: Expression): boolean {
        if (expr instanceof InstanceFieldReference) {
            const actualType = GenericsResolver.fromObject(expr.object).resolveType(expr.field.type, true);
            expr.setActualType(actualType);
            return true;
        } else if (expr instanceof InstancePropertyReference) {
            const actualType = GenericsResolver.fromObject(expr.object).resolveType(expr.property.type, true);
            expr.setActualType(actualType);
            return true;
        } else if (expr instanceof StaticPropertyReference) {
            expr.setActualType(expr.decl.type);
            return true;
        } else if (expr instanceof StaticFieldReference) {
            expr.setActualType(expr.decl.type);
            return true;
        }

        return false;
    }
}