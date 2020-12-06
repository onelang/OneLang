import { TSOverviewGenerator } from "../../Utils/TSOverviewGenerator";
import { Expression, IMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, StaticMethodCallExpression } from "../Ast/Expressions";
import { InstanceFieldReference, StaticFieldReference, VariableDeclarationReference } from "../Ast/References";
import { Block, Statement, VariableDeclaration } from "../Ast/Statements";
import { IMethodBase, IVariable, Lambda, MutabilityInfo } from "../Ast/Types";
import { AstTransformer } from "../AstTransformer";

export interface IExpressionNamingStrategy {
    getNameFor(expr: Expression): string;
}

export class DefaultExpressionNamingStrategy implements IExpressionNamingStrategy {
    getNameFor(expr: Expression): string {
        if (expr instanceof InstanceMethodCallExpression || expr instanceof StaticMethodCallExpression)
            return `${(<IMethodCallExpression>expr).method.name}Result`;
        return "result";
    }
}

export class VariableNameHandler {
    usageCount = new Map<string, number>();

    useName(name: string) {
        if (this.usageCount.has(name)) {
            const newIdx = this.usageCount.get(name) + 1;
            this.usageCount.set(name, newIdx);
            return `${name}${newIdx}`;
        } else {
            this.usageCount.set(name, 1);
            return name;
        }
    }

    resetScope() {
        this.usageCount = new Map<string, number>();
    }
}

export class ConvertNullCoalesce extends AstTransformer {
    exprNaming = new DefaultExpressionNamingStrategy();
    varNames = new VariableNameHandler();
    statements: Statement[] = [];

    constructor() { super("RemoveNullCoalesce"); }

    protected visitVariable(variable: IVariable): IVariable {
        this.varNames.useName(variable.name);
        return super.visitVariable(variable);
    }

    protected visitMethodBase(methodBase: IMethodBase) {
        if (!(methodBase instanceof Lambda))
            this.varNames.resetScope();
        super.visitMethodBase(methodBase);
    }

    // TODO: understand what goes wrong in C# -> if we convert this to array and then back to list then it won't work anymore (it removes all statements basically)
    protected visitBlock(block: Block): Block {
        // @csharp var prevStatements = this.statements;
        const prevStatements = this.statements;
        this.statements = [];
        for (const stmt of block.statements)
            this.statements.push(this.visitStatement(stmt));
        block.statements = this.statements;
        // @csharp this.statements = prevStatements;
        this.statements = prevStatements;
        return block;
    }

    protected visitExpression(expr: Expression): Expression {
        expr = super.visitExpression(expr);
        if (expr instanceof NullCoalesceExpression) {
            if (expr.defaultExpr instanceof InstanceFieldReference || expr.defaultExpr instanceof StaticFieldReference)
                return expr;

            const varName = this.varNames.useName(this.exprNaming.getNameFor(expr.defaultExpr));

            const varDecl = new VariableDeclaration(varName, expr.defaultExpr.getType(), expr.defaultExpr);
            varDecl.mutability = new MutabilityInfo(false, false, false);
            this.statements.push(varDecl);

            expr.defaultExpr = new VariableDeclarationReference(varDecl);
        }
        return expr;
    }
}