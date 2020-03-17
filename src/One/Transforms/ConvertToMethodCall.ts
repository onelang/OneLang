import { Expression, ElementAccessExpression, UnresolvedCallExpression, PropertyAccessExpression, BinaryExpression } from "../Ast/Expressions";
import { AstTransformer } from "../AstTransformer";

export class ConvertToMethodCall extends AstTransformer {
    protected visitExpression(expr: Expression) {
        super.visitExpression(expr);
        if (expr instanceof ElementAccessExpression)
            return new UnresolvedCallExpression(new PropertyAccessExpression(expr.object, "get"), [], [expr.elementExpr]);
        else if (expr instanceof BinaryExpression && expr.operator === "in")
            return new UnresolvedCallExpression(new PropertyAccessExpression(expr.right, "hasKey"), [], [expr.left]);
    }
}