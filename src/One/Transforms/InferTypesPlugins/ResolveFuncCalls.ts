import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnresolvedCallExpression, GlobalFunctionCallExpression, LambdaCallExpression } from "../../Ast/Expressions";
import { GlobalFunctionReference } from "../../Ast/References";
import { LambdaType } from "../../Ast/AstTypes";

// converts `parseInt(...)` -> UnresolvedCallExpression(GlobalFunctionReference) to GlobalFunctionCallExpression
// converts `someLambda(...)` -> UnresolvedCallExpression(variable[LambdaType]) to LambdaCallExpression
export class ResolveFuncCalls extends InferTypesPlugin {
    name = "ResolveFuncCalls";
    
    canTransform(expr: Expression) { return expr instanceof UnresolvedCallExpression; }

    transform(expr: Expression): Expression {
        const callExpr = <UnresolvedCallExpression> expr;
        if (callExpr.func instanceof GlobalFunctionReference) {
            const newExpr = new GlobalFunctionCallExpression(callExpr.func.decl, callExpr.args);
            callExpr.args = callExpr.args.map(arg => this.main.visitExpression(arg) || arg);
            newExpr.setActualType(callExpr.func.decl.returns);
            return newExpr;
        } else {
            this.main.processExpression(expr);
            if (callExpr.func.actualType instanceof LambdaType) {
                const newExpr = new LambdaCallExpression(callExpr.func, callExpr.args);
                newExpr.setActualType(callExpr.func.actualType.returnType);
                return newExpr;
            } else {
                debugger;
            }
        }
    }
}