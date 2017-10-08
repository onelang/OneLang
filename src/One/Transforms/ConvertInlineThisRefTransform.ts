import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";

/**
 * Converts "<x>._one" to "<x>".
 */
export class ConvertInlineThisRefTransform extends AstVisitor<void> implements ISchemaTransform {
    name = "convertInlineThisRef";
    dependencies = ["inferTypes"];

    protected visitVariableRef(expr: one.VariableRef) {
        if (expr.varType === one.VariableRefType.InstanceField && expr.varRef.name === "_one") {
            AstHelper.replaceProperties(expr, expr.thisExpr);
        } else {
            super.visitVariableRef(expr, null);
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}