import { Expression, ElementAccessExpression, UnresolvedCallExpression, PropertyAccessExpression, BinaryExpression, StringLiteral } from "../Ast/Expressions";
import { AstTransformer } from "../AstTransformer";

export class ConvertToMethodCall extends AstTransformer {
    name = "ConvertToMethodCall";
    
    protected visitExpression(expr: Expression) {
        expr = super.visitExpression(expr) || expr;

        let result: Expression = null;
        if (expr instanceof ElementAccessExpression) {
            result = new UnresolvedCallExpression(new PropertyAccessExpression(expr.object, "get"), [], [expr.elementExpr]);
        } else if (expr instanceof BinaryExpression && expr.operator === "in")
            result = new UnresolvedCallExpression(new PropertyAccessExpression(expr.right, "hasKey"), [], [expr.left]);

        if (result !== null)
            result.parentNode = expr.parentNode;

        return result;
    }
}