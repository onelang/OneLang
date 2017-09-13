import { KSLangSchema as ks } from "./KSLangSchema";

export abstract class KsModelVisitor<TContext> {
    protected abstract log(data: string);
    
    protected visitIdentifier(id: ks.Identifier, context: TContext) { }

    protected visitReturnStatement(stmt: ks.ReturnStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitExpressionStatement(stmt: ks.ExpressionStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitIfStatement(stmt: ks.IfStatement, context: TContext) {
        this.visitExpression(stmt.condition, context);
        this.visitBlock(stmt.then, context);
        this.visitBlock(stmt.else, context);
    }

    protected visitThrowStatement(stmt: ks.ThrowStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitVariableDeclaration(stmt: ks.VariableDeclaration, context: TContext) {
        this.visitExpression(stmt.initializer, context);
    }

    protected visitWhileStatement(stmt: ks.WhileStatement, context: TContext) {
        this.visitExpression(stmt.condition, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitForStatement(stmt: ks.ForStatement, context: TContext) {
        this.visitExpression(stmt.itemVariable.initializer, context);
        this.visitExpression(stmt.condition, context);
        this.visitExpression(stmt.incrementor, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitForeachStatement(stmt: ks.ForeachStatement, context: TContext) {
        this.visitExpression(stmt.items, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitUnknownStatement(stmt: ks.Statement, context: TContext) {
        this.log(`Unknown statement type: ${stmt.stmtType}`);
    }

    protected visitStatement(statement: ks.Statement, context: TContext) {
        if (statement.stmtType === ks.StatementType.Return) {
            this.visitReturnStatement(<ks.ReturnStatement> statement, context);
        } else if (statement.stmtType === ks.StatementType.Expression) {
            this.visitExpressionStatement(<ks.ExpressionStatement> statement, context);
        } else if (statement.stmtType === ks.StatementType.If) {
            this.visitIfStatement(<ks.IfStatement> statement, context);
        } else if (statement.stmtType === ks.StatementType.Throw) {
            this.visitThrowStatement(<ks.ThrowStatement> statement, context);
        } else if (statement.stmtType === ks.StatementType.Variable) {
            this.visitVariableDeclaration(<ks.VariableDeclaration> statement, context);
        } else if (statement.stmtType === ks.StatementType.While) {
            this.visitWhileStatement(<ks.WhileStatement> statement, context);
        } else if (statement.stmtType === ks.StatementType.For) {
            this.visitForStatement(<ks.ForStatement> statement, context);
        } else if (statement.stmtType === ks.StatementType.Foreach) {
            this.visitForeachStatement(<ks.ForeachStatement> statement, context);
        } else {
            this.visitUnknownStatement(statement, context);
        }
    }

    protected visitBlock(block: ks.Block, context: TContext) {
        for (const statement of block.statements) {
            this.visitStatement(statement, context);
        }
    }

    protected visitBinaryExpression(expr: ks.BinaryExpression, context: TContext) {
        this.visitExpression(expr.left, context);
        this.visitExpression(expr.right, context);
    }

    protected visitCallExpression(expr: ks.CallExpression, context: TContext) {
        this.visitExpression(expr.method, context);
        for (const arg of expr.arguments)
            this.visitExpression(arg, context);
    }

    protected visitConditionalExpression(expr: ks.ConditionalExpression, context: TContext) {
        this.visitExpression(expr.condition, context);
        this.visitExpression(expr.whenTrue, context);
        this.visitExpression(expr.whenFalse, context);
    }

    protected visitNewExpression(expr: ks.NewExpression, context: TContext) {
        this.visitExpression(expr.class, context);
        for (const arg of expr.arguments)
            this.visitExpression(arg, context);
    }

    protected visitLiteral(expr: ks.Literal, context: TContext) { }

    protected visitParenthesizedExpression(expr: ks.ParenthesizedExpression, context: TContext) {
        this.visitExpression(expr.expression, context);
    }

    protected visitUnaryExpression(expr: ks.UnaryExpression, context: TContext) {
        this.visitExpression(expr.operand, context);
    }

    protected visitPropertyAccessExpression(expr: ks.PropertyAccessExpression, context: TContext) {
        this.visitExpression(expr.object, context);
    }

    protected visitElementAccessExpression(expr: ks.ElementAccessExpression, context: TContext) {
        this.visitExpression(expr.object, context);
        this.visitExpression(expr.elementExpr, context);
    }

    protected visitArrayLiteral(expr: ks.ArrayLiteral, context: TContext) {
        for (const item of expr.items)
            this.visitExpression(item, context);
    }

    protected visitUnknownExpression(expr: ks.Expression, context: TContext) {
        this.log(`Unknown expression type: ${expr.exprKind}`);
    }

    protected visitExpression(expression: ks.Expression, context: TContext) {
        if (expression.exprKind === ks.ExpressionKind.Binary) {
            this.visitBinaryExpression(<ks.BinaryExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.Call) {
            this.visitCallExpression(<ks.CallExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.Conditional) {
            this.visitConditionalExpression(<ks.ConditionalExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.Identifier) {
            this.visitIdentifier(<ks.Identifier> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.New) {
            this.visitNewExpression(<ks.NewExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.Literal) {
            this.visitLiteral(<ks.Literal> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.Parenthesized) {
            this.visitParenthesizedExpression(<ks.ParenthesizedExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.Unary) {
            this.visitUnaryExpression(<ks.UnaryExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.PropertyAccess) {
            this.visitPropertyAccessExpression(<ks.PropertyAccessExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.ElementAccess) {
            this.visitElementAccessExpression(<ks.ElementAccessExpression> expression, context);
        } else if (expression.exprKind === ks.ExpressionKind.ArrayLiteral) {
            this.visitArrayLiteral(<ks.ArrayLiteral> expression, context);
        } else {
            this.visitUnknownExpression(expression, context);
        }
    }
}