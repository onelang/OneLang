import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnresolvedMethodCallExpression, InstanceMethodCallExpression } from "../../Ast/Expressions";
import { ClassType, Type, IInterfaceType } from "../../Ast/AstTypes";
import { GenericsResolver } from "./Helpers/GenericsResolver";

export class ResolveMethodCalls extends InferTypesPlugin {
    name = "ResolveMethodCalls";
    
    protected transformMethodCall(expr: UnresolvedMethodCallExpression): Expression {
        const resolvedObject = this.main.visitExpression(expr.object) || expr.object;
        const objectType = resolvedObject.getType();
        if (objectType instanceof ClassType) {
            const methods = objectType.decl.methods.filter(x => x.name === expr.methodName && 
                x.parameters.filter(p => p.initializer === null).length <= expr.args.length && expr.args.length <= x.parameters.length);
            if (methods.length === 0)
                throw new Error(`Method '${expr.methodName}' was not found on type '${objectType.repr()}' with ${expr.args.length} arguments`);
            else if (methods.length > 1)
                throw new Error(`Multiple methods found with name '${expr.methodName}' and ${expr.args.length} arguments on type '${objectType.repr()}'`);

            const result = new InstanceMethodCallExpression(resolvedObject, methods[0], expr.typeArgs, expr.args);
            const genericsResolver = GenericsResolver.fromObject(resolvedObject);

            for (let i = 0; i < result.args.length; i++) {
                const paramType = genericsResolver.resolveType(result.method.parameters[i].type, false);
                result.args[i].setExpectedType(paramType);
                result.args[i] = this.main.visitExpression(result.args[i]);
                genericsResolver.collectResolutionsFromActualType(paramType, result.args[i].actualType);
            }

            result.setActualType(genericsResolver.resolveType(result.method.returns, true), true);
            return result;
        } else {
            debugger;
        }
        return null;
    }

    canTransform(expr: Expression) { return expr instanceof UnresolvedMethodCallExpression; }

    transform(expr: Expression): Expression {
        return this.transformMethodCall(<UnresolvedMethodCallExpression> expr);
    }
}