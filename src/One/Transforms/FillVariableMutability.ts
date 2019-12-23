import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

/**
 * Fills out `isMutable` and `isUnused` properties of variables.
 * 
 * It sets `isMutable` to `false` and `isUnused` to `true` by default, and if a variable
 *   has a reference then it sets `isUnused` to `false` and if the reference is used
 *   for modification, then it sets `isMutable` to `true`
 */
export class FillVariableMutability extends AstVisitor<boolean> {
    constructor(public lang: LangFileSchema.LangFile) { super(); }
    
    protected visitBinaryExpression(expr: one.BinaryExpression, isMutable: boolean) {
        this.visitExpression(expr.left, AstHelper.isBinaryOpModifies(expr));
        this.visitExpression(expr.right, false);
    }

    protected visitCallExpression(callExpr: one.CallExpression, isMutable: boolean) {
        const method = AstHelper.getMethodFromRef(this.lang, <one.MethodReference> callExpr.method);
        const mutates = method && method.mutates;
        
        this.visitExpression(callExpr.method, mutates);
        for (const arg of callExpr.arguments)
            this.visitExpression(arg, false);
    }

    protected visitVariable(stmt: one.VariableBase) {
        stmt.isMutable = false;
        stmt.isUnused = true;
    }

    protected visitVariableRef(expr: one.VariableRef, isMutable: boolean) {
        if (expr.thisExpr)
            this.visitExpression(expr.thisExpr, false);

        if (isMutable)
            expr.varRef.isMutable = true;

        expr.varRef.isUnused = false;
    }

    protected visitUnaryExpression(expr: one.UnaryExpression) {
        this.visitExpression(expr.operand, true);
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, false);
    }
}