import { OneAst as one } from "./Ast";

export abstract class AstVisitor<TContext> {
    protected log(data: any) {
        const thisClassName = (<any>this).constructor.name;
        console.log(`[${thisClassName}]`, data);
    }
    
    protected visitIdentifier(id: one.Identifier, context: TContext) { }

    protected visitReturnStatement(stmt: one.ReturnStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitExpressionStatement(stmt: one.ExpressionStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitIfStatement(stmt: one.IfStatement, context: TContext) {
        this.visitExpression(stmt.condition, context);
        this.visitBlock(stmt.then, context);
        if (stmt.else)
            this.visitBlock(stmt.else, context);
    }

    protected visitThrowStatement(stmt: one.ThrowStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitVariable(stmt: one.VariableBase, context: TContext) {
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: TContext) {
        this.visitVariable(stmt, context);
        if (stmt.initializer)
            this.visitExpression(stmt.initializer, context);
    }

    protected visitWhileStatement(stmt: one.WhileStatement, context: TContext) {
        this.visitExpression(stmt.condition, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitForStatement(stmt: one.ForStatement, context: TContext) {
        this.visitVariableDeclaration(stmt.itemVariable, context);
        this.visitExpression(stmt.itemVariable.initializer, context);
        this.visitExpression(stmt.condition, context);
        this.visitExpression(stmt.incrementor, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitForeachStatement(stmt: one.ForeachStatement, context: TContext) {
        this.visitVariableDeclaration(stmt.itemVariable, context);
        this.visitExpression(stmt.items, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitBreakStatement(stmt: one.Statement, context: TContext) { }

    protected visitUnknownStatement(stmt: one.Statement, context: TContext) {
        this.log(`Unknown statement type: ${stmt.stmtType}`);
    }

    protected visitStatement(statement: one.Statement, context: TContext) {
        if (statement.stmtType === one.StatementType.Return) {
            return this.visitReturnStatement(<one.ReturnStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.ExpressionStatement) {
            return this.visitExpressionStatement(<one.ExpressionStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.If) {
            return this.visitIfStatement(<one.IfStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.Throw) {
            return this.visitThrowStatement(<one.ThrowStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.VariableDeclaration) {
            return this.visitVariableDeclaration(<one.VariableDeclaration> statement, context);
        } else if (statement.stmtType === one.StatementType.While) {
            return this.visitWhileStatement(<one.WhileStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.For) {
            return this.visitForStatement(<one.ForStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.Foreach) {
            return this.visitForeachStatement(<one.ForeachStatement> statement, context);
        } else if (statement.stmtType === one.StatementType.Break) {
            return this.visitBreakStatement(statement, context);
        } else {
            return this.visitUnknownStatement(statement, context);
        }
    }

    protected visitBlock(block: one.Block, context: TContext) {
        for (const statement of block.statements) {
            this.visitStatement(statement, context);
        }
    }

    protected visitBinaryExpression(expr: one.BinaryExpression, context: TContext) {
        this.visitExpression(expr.left, context);
        this.visitExpression(expr.right, context);
    }

    protected visitCallExpression(expr: one.CallExpression, context: TContext) {
        this.visitExpression(expr.method, context);
        for (const arg of expr.arguments)
            this.visitExpression(arg, context);
    }

    protected visitConditionalExpression(expr: one.ConditionalExpression, context: TContext) {
        this.visitExpression(expr.condition, context);
        this.visitExpression(expr.whenTrue, context);
        this.visitExpression(expr.whenFalse, context);
    }

    protected visitNewExpression(expr: one.NewExpression, context: TContext) {
        this.visitExpression(expr.cls, context);
        for (const arg of expr.arguments)
            this.visitExpression(arg, context);
    }

    protected visitLiteral(expr: one.Literal, context: TContext) { }

    protected visitTemplateString(expr: one.TemplateString, context: TContext) {
        for (const part of expr.parts.filter(x => x.expr))
            this.visitExpression(part.expr, context);
    }
    
    protected visitParenthesizedExpression(expr: one.ParenthesizedExpression, context: TContext) {
        this.visitExpression(expr.expression, context);
    }

    protected visitUnaryExpression(expr: one.UnaryExpression, context: TContext) {
        this.visitExpression(expr.operand, context);
    }

    protected visitPropertyAccessExpression(expr: one.PropertyAccessExpression, context: TContext) {
        this.visitExpression(expr.object, context);
    }

    protected visitElementAccessExpression(expr: one.ElementAccessExpression, context: TContext) {
        this.visitExpression(expr.object, context);
        this.visitExpression(expr.elementExpr, context);
    }

    protected visitArrayLiteral(expr: one.ArrayLiteral, context: TContext) {
        for (const item of expr.items)
            this.visitExpression(item, context);
    }

    protected visitMapLiteral(expr: one.MapLiteral, context: TContext) {
        for (const item of expr.properties)
            this.visitVariableDeclaration(item, context);
    }

    protected visitUnknownExpression(expr: one.Expression, context: TContext) {
        this.log(`Unknown expression type: ${expr.exprKind}`);
    }

    protected visitVariableRef(expr: one.VariableRef, context: TContext) {
        if (expr.thisExpr)
            this.visitExpression(expr.thisExpr, context);
    }

    protected visitMethodReference(expr: one.MethodReference, context: TContext) {
        if (expr.thisExpr)
            this.visitExpression(expr.thisExpr, context);
    }

    protected visitClassReference(expr: one.ClassReference, context: TContext) { }
    
    protected visitThisReference(expr: one.ThisReference, context: TContext) { }

    protected visitExpression(expression: one.Expression, context: TContext) {
        if (expression.exprKind === one.ExpressionKind.Binary) {
            return this.visitBinaryExpression(<one.BinaryExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.Call) {
            return this.visitCallExpression(<one.CallExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.Conditional) {
            return this.visitConditionalExpression(<one.ConditionalExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.Identifier) {
            return this.visitIdentifier(<one.Identifier> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.New) {
            return this.visitNewExpression(<one.NewExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.Literal) {
            return this.visitLiteral(<one.Literal> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.TemplateString) {
            return this.visitTemplateString(<one.TemplateString> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.Parenthesized) {
            return this.visitParenthesizedExpression(<one.ParenthesizedExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.Unary) {
            return this.visitUnaryExpression(<one.UnaryExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.PropertyAccess) {
            return this.visitPropertyAccessExpression(<one.PropertyAccessExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.ElementAccess) {
            return this.visitElementAccessExpression(<one.ElementAccessExpression> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.ArrayLiteral) {
            return this.visitArrayLiteral(<one.ArrayLiteral> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.MapLiteral) {
            return this.visitMapLiteral(<one.MapLiteral> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.VariableReference) {
            return this.visitVariableRef(<one.VariableRef> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.MethodReference) {
            return this.visitMethodReference(<one.MethodReference> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.ClassReference) {
            return this.visitClassReference(<one.ClassReference> expression, context);
        } else if (expression.exprKind === one.ExpressionKind.ThisReference) {
            return this.visitThisReference(<one.ThisReference> expression, context);
        } else {
            return this.visitUnknownExpression(expression, context);
        }
    }

    protected visitMethodLike(method: one.Method|one.Constructor, context: TContext) {
        if (method.body)
            this.visitBlock(method.body, context);

        for (const param of method.parameters)
            this.visitVariableDeclaration(param, context);
    }

    protected visitMethod(method: one.Method, context: TContext) {
        this.visitMethodLike(method, context);
    }
 
    protected visitConstructor(constructor: one.Constructor, context: TContext) {
        this.visitMethodLike(constructor, context);
    }
 
    protected visitField(field: one.Field, context: TContext) {
        this.visitVariableDeclaration(field, context);
    }
 
    protected visitProperty(prop: one.Property, context: TContext) {
        this.visitBlock(prop.getter, context);
        this.visitVariable(prop, context);
    }
 
    protected visitClass(cls: one.Class, context: TContext) {
        if (cls.constructor)
            this.visitConstructor(cls.constructor, context);

        for (const method of Object.values(cls.methods))
            this.visitMethod(method, context);

        for (const prop of Object.values(cls.properties))
            this.visitProperty(prop, context);

        for (const field of Object.values(cls.fields))
            this.visitField(field, context);
    }
 
    protected visitSchema(schema: one.Schema, context: TContext) {
        for (const cls of Object.values(schema.classes)) {
            this.visitClass(cls, context);
        }
    }
}