import { OneAst as one } from "./Ast";
import { AstVisitor } from "./AstVisitor";

export class OverviewGenerator extends AstVisitor<void> {
    result = "";
    pad = "";
    padWasAdded = false;

    constructor(public schema: one.Schema) {
        super();
        this.generate();
    }

    log(data: string) {
        console.log(`[OverviewGenerator] ${data}`);
    }

    addLine(line: string) {
        this.add(`${line}\n`);
        this.padWasAdded = false;
    }

    add(data: string) {
        if (!this.padWasAdded) {
            this.result += this.pad;
            this.padWasAdded = true;
        }

        this.result += data;
    }

    indent(num: -1|1) {
        if (num === 1)
            this.pad += "  ";
        else
            this.pad = this.pad.substr(0, this.pad.length - 2);
    }

    visitStatement(statement: one.Statement) {
        if (statement === null) {
            this.addLine("<null>");
        } else if (statement.stmtType === one.StatementType.If) {
            const stmt = <one.IfStatement> statement;
            this.addLine(`If`);
            this.visitExpression(stmt.condition);
            this.addLine(`Then`);
            this.visitBlock(stmt.then);
            this.addLine(`Else`);
            this.visitBlock(stmt.else);
        } else if (statement.stmtType === one.StatementType.Variable) {
            const stmt = <one.VariableDeclaration> statement;
            this.addLine(`Variable: ${stmt.variableName}`);
            this.visitExpression(stmt.initializer);
        } else if (statement.stmtType === one.StatementType.While) {
            const stmt = <one.WhileStatement> statement;
            this.addLine(`While`);
            this.indent(1);
            this.visitExpression(stmt.condition);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.Foreach) {
            const stmt = <one.ForeachStatement> statement;
            this.addLine(`Foreach ${stmt.varName}: ${stmt.varType && stmt.varType.repr()}`);
            this.indent(1);
            this.addLine(`Items`);
            this.visitExpression(stmt.items);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.For) {
            const stmt = <one.ForStatement> statement;
            this.addLine(`For ("${stmt.itemVariable.variableName}")`);
            this.indent(1);
            this.addLine(`Condition`);
            this.visitExpression(stmt.condition);
            this.addLine(`Incrementor`);
            this.visitExpression(stmt.incrementor);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else {
            this.addLine(`${statement.stmtType}`);
            super.visitStatement(statement, null);
        }
    }

    visitBlock(block: one.Block) {
        this.indent(1);

        for (const statement of block.statements) {
            this.add("- ");
            this.visitStatement(statement);
        }

        this.indent(-1);
    }

    visitUnknownExpression(expression: one.Expression) {
        this.addLine(`${expression.exprKind} (unknown!)`);
    }

    visitExpression(expression: one.Expression) {
        this.indent(1);
        
        this.add("- ");

        const addHdr = (line: string) => {
            this.addLine(`${line}` + (expression.valueType ? ` [${expression.valueType.repr()}]` : ""));
        };

        if (expression === null) {
            addHdr("<null>");
        } else if (expression.exprKind === one.ExpressionKind.Binary) {
            const expr = <one.BinaryExpression> expression;
            addHdr(`Binary: ${expr.operator}`);
            super.visitExpression(expression, null);
        } else if (expression.exprKind === one.ExpressionKind.Identifier) {
            const expr = <one.Identifier> expression;
            addHdr(`Identifier: ${expr.text}`);
        } else if (expression.exprKind === one.ExpressionKind.Literal) {
            const expr = <one.Literal> expression;
            const value = expr.literalType === "string" ? `"${expr.value}"` : expr.value;
            addHdr(`Literal (${expr.literalType}): ${value}`);
        } else if (expression.exprKind === one.ExpressionKind.Unary) {
            const expr = <one.UnaryExpression> expression;
            addHdr(`Unary (${expr.unaryType}): ${expr.operator}`);
            super.visitExpression(expression, null);
        } else if (expression.exprKind === one.ExpressionKind.PropertyAccess) {
            const expr = <one.PropertyAccessExpression> expression;
            addHdr(`PropertyAccess (.${expr.propertyName})`);
            super.visitExpression(expression, null);
        } else {
            addHdr(expression.exprKind);
            super.visitExpression(expression, null);
        }

        this.indent(-1);
    }

    generate() {
        for (const cls of Object.values(this.schema.classes)) {
            for (const method of Object.values(cls.methods)) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type.repr()}`).join(", ");
                this.addLine(`${cls.name}::${method.name}(${argList}): ${method.returns.repr()}`);
                this.visitBlock(method.body);
                this.addLine("");
            }
        }
        return this.result;
    }
}
