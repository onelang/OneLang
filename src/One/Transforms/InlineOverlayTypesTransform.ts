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

/**
 * Replaces call expressions which call into overlay methods to their statements inlined.
 * It also replaces overlay InstanceField references.
 */
class ReplaceReferences extends AstVisitor<void> {
    constructor(public schemaCtx: SchemaContext) { super(); }

    protected visitCallExpression(expr: one.CallExpression) {
        super.visitCallExpression(expr, null);

        if (expr.method.exprKind === one.ExpressionKind.MethodReference) {
            const methodRef = <one.MethodReference> expr.method;
            const method = methodRef.methodRef;
            const cls = method.classRef;
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

    protected visitVariableRef(expr: one.VariableRef) {
        if (expr.varType !== one.VariableRefType.InstanceField) return;

        const prop = <one.Property> expr.varRef;
        if (!(prop.classRef.meta && prop.classRef.meta.overlay)) return;

        const stmts = prop.getter.statements;
        if (!(stmts.length === 1 && stmts[0].stmtType === one.StatementType.Return)) {
            this.log("Overlay field should contain exactly one return statement!");
            return;
        }

        const statements = AstHelper.clone(stmts);
        
        const varReplacer = new VariableReplacer();
        varReplacer.thisReplacement = expr.thisExpr;
        varReplacer.visitStatements(statements);

        const retStmt = <one.ReturnStatement> statements[0];
        AstHelper.replaceProperties(expr, retStmt.expression);
    }

    protected visitExpressionStatement(stmt: one.ExpressionStatement) {
        return this.visitExpression(stmt.expression, null);
    }
    
    /**
     * Goes through all statements in a block. One such statement can be converted
     * to more statements.
     */
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

    process() {
        this.visitSchema(this.schemaCtx.schema, null);
    }
}

class ReplaceVariables extends AstVisitor<void> {
    constructor(public schemaCtx: SchemaContext) { super(); }

    protected visitVariable(stmt: one.VariableBase) {
        const clsName = stmt.type.className;
        const cls = clsName && this.schemaCtx.getClass(clsName);
        if (!(cls && cls.meta && cls.meta.overlay)) return;

        stmt.type.className = cls.fields["_one"].type.className;
    }

    process() {
        this.visitSchema(this.schemaCtx.schema, null);
    }
}

export class InlineOverlayTypesTransform implements ISchemaTransform {
    name = "inlineOverlayTypes";
    dependencies = ["inferTypes"];

    transform(schemaCtx: SchemaContext) {
        new ReplaceReferences(schemaCtx).process();
        new ReplaceVariables(schemaCtx).process();
    }
}