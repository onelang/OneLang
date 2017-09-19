import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";

export class VariableReplacer extends AstVisitor<void> {
    thisReplacement: one.Expression;
    replacements: { [varPath: string]: one.Expression } = {};

    protected visitThisReference(expr: one.ThisReference) {
        if (this.thisReplacement)
            AstHelper.replaceProperties(expr, this.thisReplacement);
    }
    
    protected visitVariableRef(expr: one.VariableRef) {
        if (expr.thisExpr)
            this.visitExpression(expr.thisExpr, null);

        const changeTo = this.replacements[expr.varRef.metaPath];
        if (changeTo)
            AstHelper.replaceProperties(expr, changeTo);
    }

    visitStatements(statements: one.Statement[]) {
        for (const statement of statements)
            this.visitStatement(statement, null);
    }
}

export class InlineOverlayTypesTransform extends AstVisitor<void> implements ISchemaTransform {
    name = "inlineOverlayTypes";
    dependencies = ["inferTypes"];

    protected visitCallExpression(expr: one.CallExpression) {
        super.visitCallExpression(expr, null);

        if (expr.method.exprKind === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> expr.method;
            const method = methodRef.methodRef;
            const cls = method.parentRef;
            if (cls.meta && cls.meta.overlay) {
                if (method.parameters.length != expr.arguments.length) {
                    this.log(`Called overlay method ${AstHelper.methodRepr(method)} ` +
                        `with parameters (${expr.arguments.map(x => x.valueType.repr()).join(", ")})`);
                    return;
                }

                const statements = AstHelper.clone(method.body.statements);

                const varReplacer = new VariableReplacer();
                varReplacer.thisReplacement = methodRef.thisExpr;
                for (var i = 0; i < method.parameters.length; i++)
                    varReplacer.replacements[method.parameters[i].metaPath] = expr.arguments[i];

                // TODO: 
                //  - resolve variable declaration conflicts
                varReplacer.visitStatements(statements);
                return statements;
            }
        }
    }

    protected visitExpressionStatement(stmt: one.ExpressionStatement) {
        return this.visitExpression(stmt.expression, null);
    }
    
    protected visitBlock(block: one.Block) {
        const newStatements = [];
        for (const statement of block.statements) {
            const newValue = this.visitStatement(statement, null);
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