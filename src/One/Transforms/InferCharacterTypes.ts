import { ISchemaTransform } from "./../SchemaTransformer";
import { OneAst as one } from "./../Ast";
import { SchemaContext } from "../SchemaContext";
import { AstVisitor } from "../AstVisitor";

export class InferCharacterTypes extends AstVisitor<void> implements ISchemaTransform {
    name = "inferCharacterTypes";

    protected tryConvertLiteral(expr: one.Expression) {
        const litExpr = <one.Literal> expr;
        if (expr.exprKind === one.ExpressionKind.Literal && litExpr.literalType === "string" && (<string>litExpr.value).length === 1) {
            expr.valueType = one.Type.Class("OneCharacter");
            litExpr.literalType = "character";
        }
    }

    protected visitBinaryExpression(expr: one.BinaryExpression) {
        super.visitBinaryExpression(expr, null);
        if (["==", "<=", ">="].includes(expr.operator)) {
            if (expr.left.valueType.isCharacter)
                this.tryConvertLiteral(expr.right);
            else if (expr.right.valueType.isCharacter)
                this.tryConvertLiteral(expr.left);
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}