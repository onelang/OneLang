import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnaryExpression, BinaryExpression, NullLiteral } from "../../Ast/Expressions";
import { ClassType } from "../../Ast/AstTypes";

// converts "!SomeObject" to "SomeObject === null"
export class NullabilityCheckWithNot extends InferTypesPlugin {
    name = "NullabilityCheckWithNot";

    canTransform(expr: Expression) { return expr instanceof UnaryExpression ? expr.operator === "!" : false; }

    transform(expr: Expression): Expression {
        const unaryExpr = <UnaryExpression> expr;
        if (unaryExpr.operator === "!") {
            this.main.processExpression(expr);
            const type = unaryExpr.operand.actualType;
            const litTypes = this.main.currentFile.literalTypes;
            if (type instanceof ClassType && type.decl !== litTypes.boolean.decl && type.decl !== litTypes.numeric.decl)
                return new BinaryExpression(unaryExpr.operand, "==", new NullLiteral());
            return unaryExpr;
        }

        return null;
    }
}