import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, StaticMethodCallExpression } from "../../Ast/Expressions";
import { ClassType, Type, IInterfaceType, InterfaceType, AnyType } from "../../Ast/AstTypes";
import { GenericsResolver } from "./Helpers/GenericsResolver";
import { ClassReference, ThisReference } from "../../Ast/References";
import { Class, IInterface, Method } from "../../Ast/Types";

export class ResolveMethodCalls extends InferTypesPlugin {
    name = "ResolveMethodCalls";

    protected findMethod(cls: IInterface, methodName: string, isStatic: boolean, args: Expression[]) {
        const methods = cls.methods.filter(x => x.name === methodName && x.isStatic === isStatic &&
            x.parameters.filter(p => p.initializer === null).length <= args.length && args.length <= x.parameters.length);
        if (methods.length === 0)
            throw new Error(`Method '${methodName}' was not found on type '${cls.name}' with ${args.length} arguments`);
        else if (methods.length > 1)
            throw new Error(`Multiple methods found with name '${methodName}' and ${args.length} arguments on type '${cls.name}'`);
        return methods[0];
    }
    
    protected transformMethodCall(expr: UnresolvedMethodCallExpression): Expression {
        if (expr.object instanceof ClassReference) {
            const cls = expr.object.decl;
            const method = this.findMethod(cls, expr.methodName, true, expr.args);
            const result = new StaticMethodCallExpression(method, expr.typeArgs, expr.args);
            result.setActualType(result.method.returns, true);
            return result;
        } else {
            const resolvedObject = this.main.visitExpression(expr.object) || expr.object;
            const objectType = resolvedObject.getType();
            const intfType: IInterface = objectType instanceof ClassType ? 
                objectType.decl : objectType instanceof InterfaceType ? objectType.decl : null;

            if (intfType !== null) {
                const isStatic = expr.object instanceof ThisReference && this.main.currentMethod instanceof Method && this.main.currentMethod.isStatic;
                const method = this.findMethod(intfType, expr.methodName, isStatic, expr.args);
                const result = new InstanceMethodCallExpression(resolvedObject, method, expr.typeArgs, expr.args);
                const genericsResolver = GenericsResolver.fromObject(resolvedObject);
    
                for (let i = 0; i < result.args.length; i++) {
                    const paramType = genericsResolver.resolveType(result.method.parameters[i].type, false);
                    result.args[i].setExpectedType(paramType);
                    result.args[i] = this.main.visitExpression(result.args[i]);
                    genericsResolver.collectResolutionsFromActualType(paramType, result.args[i].actualType);
                }
    
                result.setActualType(genericsResolver.resolveType(result.method.returns, true), true);
                return result;
            } else if (objectType instanceof AnyType) {
                expr.setActualType(AnyType.instance);
                return expr;
            } else {
                debugger;
            }
            return null;
        }
    }

    canTransform(expr: Expression) { return expr instanceof UnresolvedMethodCallExpression; }

    transform(expr: Expression): Expression {
        return this.transformMethodCall(<UnresolvedMethodCallExpression> expr);
    }
}