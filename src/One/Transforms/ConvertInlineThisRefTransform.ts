import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";

export class ConvertInlineThisRefTransform extends AstVisitor<void> implements ISchemaTransform {
    name = "convertInlineThisRef";
    dependencies = ["inferTypes"];

    protected visitClassFieldRef(expr: one.ClassFieldRef) {
        if (expr.thisExpr && expr.thisExpr.exprKind === one.ExpressionKind.ThisReference
                && expr.varRef.name === "_one") {
            AstHelper.replaceProperties(expr, one.ThisReference.instance);
        } else {
            super.visitClassFieldRef(expr, null);
        }
    }
    
    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}