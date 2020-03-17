import { AstTransformer } from "../AstTransformer";
import { ErrorManager } from "../ErrorManager";
import { InstanceOfExpression, BinaryExpression, Expression, CastExpression, ExpressionRoot, ConditionalExpression, PropertyAccessExpression } from "../Ast/Expressions";
import { Statement, IfStatement, VariableDeclaration } from "../Ast/Statements";
import { TSOverviewGenerator } from "../../Utils/TSOverviewGenerator";
import { Linq } from "../../Utils/Underscore";
import { ForeachVariableReference, VariableDeclarationReference, MethodParameterReference } from "../Ast/References";

export class ImplicitCastContext {

}

export class InstanceOfImplicitCast extends AstTransformer {
    constructor(errorMan: ErrorManager = null) { super(errorMan); }

    casts: InstanceOfExpression[] = [];

    protected addInstanceOfsToContext(condition: Expression): number {
        let castCount = 0;

        const exprToProcess: Expression[] = [condition];
        while (exprToProcess.length > 0) {
            const expr = exprToProcess.shift();
            if (expr instanceof InstanceOfExpression) {
                castCount++;
                this.casts.push(expr);
            } else if (expr instanceof BinaryExpression && expr.operator === "&&") {
                exprToProcess.push(expr.left);
                exprToProcess.push(expr.right);
            }
        }

        return castCount;
    }

    protected removeFromContext(castCount: number) {
        if (castCount !== 0)
            this.casts.splice(this.casts.length - castCount, castCount);
    }

    protected equals(expr1: Expression, expr2: Expression) {
        // MetP, V, MethP.PA, V.PA, MethP/V [ {FEVR} ], FEVR
        if (expr1 instanceof PropertyAccessExpression)
            return expr2 instanceof PropertyAccessExpression && expr1.propertyName === expr2.propertyName && this.equals(expr1.object, expr2.object);
        else if (expr1 instanceof VariableDeclarationReference)
            return expr2 instanceof VariableDeclarationReference && expr1.decl === expr2.decl;
        else if (expr1 instanceof MethodParameterReference)
            return expr2 instanceof MethodParameterReference && expr1.decl === expr2.decl;
        else if (expr1 instanceof ForeachVariableReference)
            return expr2 instanceof ForeachVariableReference && expr1.decl === expr2.decl;
        return false;
    }
    
    protected visitExpression(expr: Expression): Expression {
        let result: Expression = null;
        if (expr instanceof ConditionalExpression) {
            expr.condition = this.visitExpression(expr.condition) || expr.condition;

            const castCount = this.addInstanceOfsToContext(expr.condition);
            expr.whenTrue = this.visitExpression(expr.whenTrue) || expr.whenTrue;
            this.removeFromContext(castCount);

            expr.whenFalse = this.visitExpression(expr.whenFalse) || expr.whenFalse;
        } else {
            result = super.visitExpression(expr) || expr;
            const match = this.casts.find(cast => this.equals(result, cast.expr));
            if (match)
                result = new CastExpression(match.checkType, result, true);
        }
        return result;
    }

    protected visitStatement(stmt: Statement): Statement { 
        if (stmt instanceof IfStatement) {
            stmt.condition = this.visitExpression(stmt.condition) || stmt.condition;

            const castCount = this.addInstanceOfsToContext(stmt.condition);
            this.visitBlock(stmt.then);
            this.removeFromContext(castCount);

            if (stmt.else_)
                this.visitBlock(stmt.else_);
        } else {
            return super.visitStatement(stmt);
        }
    }
}