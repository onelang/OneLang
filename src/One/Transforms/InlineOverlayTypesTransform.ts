import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";

class Context {
}

export class InlineOverlayTypesTransform extends AstVisitor<Context> implements ISchemaTransform {
    name = "inlineOverlayTypes";
    dependencies = ["inferTypes"];

    protected visitCallExpression(expr: one.CallExpression, context: Context) {
        super.visitCallExpression(expr, context);

        if (expr.method.exprKind === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> expr.method;
            if (methodRef.cls.meta && methodRef.cls.meta.overlay) {
                const methodBody = methodRef.method.body;
                const methodBodyClone = JSON.parse(JSON.stringify(methodBody, (k, v) =>
                    k === "parent" || k === "cls" || k === "method" ? undefined : v));
                const gen = new OverviewGenerator();
                gen.visitBlock(methodBodyClone);
                console.log(gen.result);
                debugger;
            }
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}