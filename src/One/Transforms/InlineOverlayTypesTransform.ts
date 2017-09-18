import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";

class Context { }

export class InlineOverlayTypesTransform extends AstVisitor<Context> implements ISchemaTransform {
    name = "inlineOverlayTypes";
    dependencies = ["inferTypes"];

    protected visitCallExpression(expr: one.CallExpression, context: Context) {
        super.visitCallExpression(expr, context);

        if (expr.method.exprKind === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> expr.method;
            if (methodRef.classRef.meta && methodRef.classRef.meta.overlay) {
                // TODO: 
                //  - clone method
                //  - substitute arguments
                //  - resolve variable declaration conflicts
                return methodRef.methodRef.body.statements;
            }
        }
    }

    protected visitExpressionStatement(stmt: one.ExpressionStatement, context: Context) {
        return this.visitExpression(stmt.expression, context);
    }
    
    protected visitBlock(block: one.Block, context: Context) {
        const newStatements = [];
        for (const statement of block.statements) {
            const newValue = this.visitStatement(statement, context);
            if (Array.isArray(newValue))
                newStatements.push(... <one.Statement[]> <any> newValue);
            else
                newStatements.push(statement);
        }
        block.statements = newStatements;
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}