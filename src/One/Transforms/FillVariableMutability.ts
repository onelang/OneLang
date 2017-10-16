import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

export class FillVariableMutability extends AstVisitor<boolean> {
    constructor(public lang: LangFileSchema.LangFile) { super(); }
    
    protected visitBinaryExpression(expr: one.BinaryExpression, isMutable: boolean) {
        this.visitExpression(expr.left, expr.operator.includes("="));
        this.visitExpression(expr.right, false);
    }

    protected visitCallExpression(callExpr: one.CallExpression, isMutable: boolean) {
        const methodRef = <one.MethodReference> callExpr.method;
        const metaPath = methodRef.methodRef.metaPath;
        let mutates = false;
        if (metaPath) {
            const methodPathParts = metaPath.split("/");
            const method = (this.lang.classes[methodPathParts[0]].methods||{})[methodPathParts[1]];
            mutates = method && method.mutates;
        }

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