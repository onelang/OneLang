import { Expression, ElementAccessExpression, UnresolvedCallExpression, PropertyAccessExpression, BinaryExpression, StringLiteral } from "../Ast/Expressions";
import { AstTransformer } from "../AstTransformer";

export class ConvertToMethodCall extends AstTransformer {
    constructor() { super("ConvertToMethodCall"); }
    
    protected visitExpression(expr: Expression) {
        const origExpr = expr;
        if (expr instanceof BinaryExpression && expr.left instanceof ElementAccessExpression && expr.operator === "=")
            expr = new UnresolvedCallExpression(new PropertyAccessExpression(expr.left.object, "set"), [], [expr.left.elementExpr, expr.right]);

        expr = super.visitExpression(expr) || expr;

        if (expr instanceof ElementAccessExpression) {
            expr = new UnresolvedCallExpression(new PropertyAccessExpression(expr.object, "get"), [], [expr.elementExpr]);
        } else if (expr instanceof BinaryExpression && expr.operator === "in")
            expr = new UnresolvedCallExpression(new PropertyAccessExpression(expr.right, "hasKey"), [], [expr.left]);

        expr.parentNode = origExpr.parentNode;
        return expr;
    }
}