import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

export class FillVariableMutability extends AstVisitor<boolean> {
    constructor(public lang: LangFileSchema.LangFile) { super(); }
    
    protected visitCallExpression(callExpr: one.CallExpression, isMutable: boolean) {
        const methodRef = <one.MethodReference> callExpr.method;
        const metaPath = methodRef.methodRef.metaPath;
        const methodPath = metaPath && metaPath.replace(/\//g, ".");
        const method = this.lang.functions[methodPath];

        this.visitExpression(callExpr.method, method && method.mutates);
        for (const arg of callExpr.arguments)
            this.visitExpression(arg, false);
    }

    protected visitVariable(stmt: one.VariableBase) {
        stmt.isMutable = false;
    }

    protected visitVariableRef(expr: one.VariableRef, isMutable: boolean) {
        if (expr.thisExpr)
            this.visitExpression(expr.thisExpr, false);

        if (isMutable)
            expr.varRef.isMutable = true;
    }

    protected visitUnaryExpression(expr: one.UnaryExpression) {
        this.visitExpression(expr.operand, true);
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, false);
    }
}