import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, BinaryExpression, NullLiteral, NullCoalesceExpression, ArrayLiteral, MapLiteral } from "../../Ast/Expressions";
import { Type, ClassType } from "../../Ast/AstTypes";

export class TypeScriptNullCoalesce extends InferTypesPlugin {
    constructor() { super("TypeScriptNullCoalesce"); }

    canTransform(expr: Expression) { return expr instanceof BinaryExpression && expr.operator === "||"; }

    transform(expr: Expression): Expression {
        if (expr instanceof BinaryExpression && expr.operator === "||") {
            const litTypes = this.main.currentFile.literalTypes;
            
            expr.left = this.main.runPluginsOn(expr.left) || expr.left;
            const leftType = expr.left.getType();

            if (expr.right instanceof ArrayLiteral && expr.right.items.length === 0) {
                if (leftType instanceof ClassType && leftType.decl === litTypes.array.decl) {
                    expr.right.setActualType(leftType);
                    return new NullCoalesceExpression(expr.left, expr.right);
                }
            }

            if (expr.right instanceof MapLiteral && expr.right.items.length === 0) {
                if (leftType instanceof ClassType && leftType.decl === litTypes.map.decl) {
                    expr.right.setActualType(leftType);
                    return new NullCoalesceExpression(expr.left, expr.right);
                }
            }

            expr.right = this.main.runPluginsOn(expr.right) || expr.right;
            const rightType = expr.right.getType();

            if (expr.right instanceof NullLiteral) { // something-which-can-be-undefined || null
                return expr.left;
            } else if (Type.isAssignableTo(rightType, leftType) && !Type.equals(rightType, this.main.currentFile.literalTypes.boolean)) {
                return new NullCoalesceExpression(expr.left, expr.right);
            }
        }
        return null;
    }
}