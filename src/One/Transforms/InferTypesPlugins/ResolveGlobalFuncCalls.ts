import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnresolvedCallExpression, GlobalFunctionCallExpression } from "../../Ast/Expressions";
import { GlobalFunctionReference } from "../../Ast/References";

export class ResolveGlobalFuncCalls extends InferTypesPlugin {
    name = "ResolveGlobalFuncCalls";
    
    canTransform(expr: Expression) { return expr instanceof UnresolvedCallExpression && expr.func instanceof GlobalFunctionReference; }

    transform(expr: Expression): Expression {
        const callExpr = <UnresolvedCallExpression> expr;
        const func = (<GlobalFunctionReference> callExpr.func).decl;
        const newExpr = new GlobalFunctionCallExpression(func, callExpr.args);
        newExpr.setActualType(func.returns);
        return newExpr;
    }
}