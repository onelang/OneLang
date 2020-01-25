import { OneAst as one } from "./../Ast";
import { SchemaContext } from "../SchemaContext";
import { AstVisitor } from "../AstVisitor";
import { AstHelper } from "../AstHelper";

// converts 
//    var i = ...;
//    while (i <op> ...) {
//        ...
//        i-- / i++ / i ?= ...
//    }
// to 
//    for (var i = ...; i <op> ...; i...)
export class WhileToForTransform extends AstVisitor<void> {
    protected visitBlock(block: one.Block) {
        super.visitBlock(block, null);
        for (let i = 0; i < block.statements.length - 1; i++) {
            if (block.statements[i].stmtType !== "VariableDeclaration" ||
                block.statements[i + 1].stmtType !== "While") continue;

            const initVarDecl = <one.VariableDeclaration> block.statements[i];
            const whileStmt = <one.WhileStatement> block.statements[i + 1];
            const condition = <one.BinaryExpression> whileStmt.condition;
            if (condition.exprKind !== "Binary" || condition.left.exprKind !== "VariableReference" || 
                (<one.VariableRef> condition.left).varRef.name !== initVarDecl.name) continue;

            const lastStmt = <one.ExpressionStatement> whileStmt.body.statements[whileStmt.body.statements.length - 1];
            if (!lastStmt || lastStmt.stmtType !== "ExpressionStatement") continue;

            const modifiedExpr = AstHelper.getModifiedExpr(lastStmt.expression);
            if (!modifiedExpr || modifiedExpr.exprKind !== "VariableReference" ||
                (<one.VariableRef> modifiedExpr).varRef.name !== initVarDecl.name) continue;
            
            whileStmt.body.statements.pop();
            const forStmt = <one.ForStatement> { stmtType: one.StatementType.For,
                itemVariable: initVarDecl,
                condition,
                incrementor: lastStmt.expression,
                body: whileStmt.body,
                leadingTrivia: whileStmt.leadingTrivia
            };
            block.statements.splice(i, 2, forStmt);
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}