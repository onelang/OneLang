import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, BinaryExpression, NullLiteral, NullCoalesceExpression } from "../../Ast/Expressions";
import { Type } from "../../Ast/AstTypes";

export class TypeScriptNullCoalesce extends InferTypesPlugin {
    name = "TypeScriptNullCoalesce";

    canTransform(expr: Expression) { return expr instanceof BinaryExpression && expr.operator === "||"; }

    transform(expr: Expression) {
        if (expr instanceof BinaryExpression && expr.operator === "||") {
            expr.left = this.main.visitExpression(expr.left) || expr.left;
            expr.right = this.main.visitExpression(expr.right) || expr.right;
            const leftType = expr.left.getType();
            const rightType = expr.right.getType();
            if (expr.right instanceof NullLiteral) { // something-which-can-be-undefined || null
                return expr.left;
            } else if (Type.isAssignableTo(rightType, leftType) && !Type.equals(rightType, this.main.currentFile.literalTypes.boolean)) {
                return new NullCoalesceExpression(expr.left, expr.right);
            }
            return expr;
        }
        return null;
    }
}