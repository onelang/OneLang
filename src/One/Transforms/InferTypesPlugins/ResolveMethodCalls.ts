import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, StaticMethodCallExpression, IMethodCallExpression } from "../../Ast/Expressions";
import { ClassType, Type, IInterfaceType, InterfaceType, AnyType } from "../../Ast/AstTypes";
import { GenericsResolver } from "./Helpers/GenericsResolver";
import { ClassReference, ThisReference, SuperReference } from "../../Ast/References";
import { Class, IInterface, Method } from "../../Ast/Types";
import { Linq } from "../../../Utils/Underscore";
import { TSOverviewGenerator } from "../../../Utils/TSOverviewGenerator";

export class ResolveMethodCalls extends InferTypesPlugin {
    name = "ResolveMethodCalls";

    protected findMethod(cls: IInterface, methodName: string, isStatic: boolean, args: Expression[]) {
        const allBases = cls instanceof Class ? cls.getAllBaseInterfaces().filter(x => x instanceof Class) : cls.getAllBaseInterfaces();
        const allMethods = new Linq(allBases).selectMany(x => x.methods).get();
        const methods = allMethods.filter(x => x.name === methodName && x.isStatic === isStatic &&
            x.parameters.filter(p => p.initializer === null).length <= args.length && args.length <= x.parameters.length);
        if (methods.length === 0)
            throw new Error(`Method '${methodName}' was not found on type '${cls.name}' with ${args.length} arguments`);
        else if (methods.length > 1)
            throw new Error(`Multiple methods found with name '${methodName}' and ${args.length} arguments on type '${cls.name}'`);
        return methods[0];
    }

    protected resolveReturnType(expr: IMethodCallExpression, genericsResolver: GenericsResolver) {
        for (let i = 0; i < expr.args.length; i++) {
            // actually doesn't have to resolve, but must check if generic type confirm the previous argument with the same generic type
            const paramType = genericsResolver.resolveType(expr.method.parameters[i].type, false);
            if (paramType !== null)
                expr.args[i].setExpectedType(paramType);
            expr.args[i] = this.main.visitExpression(expr.args[i]);
            genericsResolver.collectResolutionsFromActualType(paramType, expr.args[i].actualType);
        }

        if (expr.method.returns === null) {
            this.errorMan.throw(`Method (${expr.method.parentInterface.name}::${expr.method.name}) return type was not specified or infered before the call.`);
            return;
        }

        expr.setActualType(genericsResolver.resolveType(expr.method.returns, true), true, false);
    }
    
    protected transformMethodCall(expr: UnresolvedMethodCallExpression): Expression {
        if (expr.object instanceof ClassReference) {
            const cls = expr.object.decl;
            const method = this.findMethod(cls, expr.methodName, true, expr.args);
            const result = new StaticMethodCallExpression(method, expr.typeArgs, expr.args);
            this.resolveReturnType(result, new GenericsResolver());
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
                this.resolveReturnType(result, GenericsResolver.fromObject(resolvedObject));
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