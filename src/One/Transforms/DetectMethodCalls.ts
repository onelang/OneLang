import { AstTransformer } from "../AstTransformer";
import { Expression, UnresolvedCallExpression, PropertyAccessExpression, UnresolvedMethodCallExpression } from "../Ast/Expressions";

/**
 * Converts "obj.method(args)" from a generic "func(args)"-style call to a method call of the "method" method on the "obj" object with "args" arguments
 */
export class DetectMethodCalls extends AstTransformer {
    constructor() { super("DetectMethodCalls"); }

    protected visitExpression(expr: Expression): Expression {
        expr = super.visitExpression(expr);
        if (expr instanceof UnresolvedCallExpression && expr.func instanceof PropertyAccessExpression)
            return new UnresolvedMethodCallExpression(expr.func.object, expr.func.propertyName, expr.typeArgs, expr.args);
        return expr;
    }
}