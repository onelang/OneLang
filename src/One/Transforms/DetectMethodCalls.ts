import { AstTransformer } from "../AstTransformer";
import { Expression, UnresolvedCallExpression, PropertyAccessExpression, UnresolvedMethodCallExpression } from "../Ast/Expressions";

export class DetectMethodCalls extends AstTransformer {
    constructor() { super("DetectMethodCalls"); }

    protected visitExpression(expr: Expression): Expression {
        super.visitExpression(expr);
        if (expr instanceof UnresolvedCallExpression && expr.func instanceof PropertyAccessExpression)
            return new UnresolvedMethodCallExpression(expr.func.object, expr.func.propertyName, expr.typeArgs, expr.args);
        return null;
    }
}