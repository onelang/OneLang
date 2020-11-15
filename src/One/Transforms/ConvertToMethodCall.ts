import { Expression, ElementAccessExpression, UnresolvedCallExpression, PropertyAccessExpression, BinaryExpression, StringLiteral } from "../Ast/Expressions";
import { AstTransformer } from "../AstTransformer";

/**
 * Converts "key in obj" to "obj.hasKey(key)"
 */
export class ConvertToMethodCall extends AstTransformer {
    constructor() { super("ConvertToMethodCall"); }
    
    protected visitExpression(expr: Expression) {
        const origExpr = expr;

        expr = super.visitExpression(expr);

        if (expr instanceof BinaryExpression && expr.operator === "in")
            expr = new UnresolvedCallExpression(new PropertyAccessExpression(expr.right, "hasKey"), [], [expr.left]);

        expr.parentNode = origExpr.parentNode;
        return expr;
    }
}