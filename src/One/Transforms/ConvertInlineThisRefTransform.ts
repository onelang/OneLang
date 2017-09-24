import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";

/**
 * Converts "this._one" to "this".
 */
export class ConvertInlineThisRefTransform extends AstVisitor<void> implements ISchemaTransform {
    name = "convertInlineThisRef";
    dependencies = ["inferTypes"];

    protected visitVariableRef(expr: one.VariableRef) {
        if (expr.thisExpr && expr.thisExpr.exprKind === one.ExpressionKind.ThisReference
                && expr.varType === one.VariableRefType.InstanceField
                && expr.varRef.name === "_one") {
            const thisRef = new one.ThisReference();
            thisRef.valueType = expr.valueType;
            AstHelper.replaceProperties(expr, thisRef);
        } else {
            super.visitVariableRef(expr, null);
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}