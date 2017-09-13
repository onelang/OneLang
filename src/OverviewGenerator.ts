import { KSLangSchema as ks } from "./KSLangSchema";
import { CodeGenerator } from "./CodeGenerator";
import { KsModelVisitor } from "./ModelVisitor";

export class OverviewGenerator extends KsModelVisitor<void> {
    result = "";
    pad = "";
    padWasAdded = false;

    constructor(public codeGen: CodeGenerator) {
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

    visitStatement(statement: ks.Statement) {
        if (statement === null) {
            this.addLine("<null>");
        } else if (statement.stmtType === ks.StatementType.If) {
            const stmt = <ks.IfStatement> statement;
            this.addLine(`If`);
            this.visitExpression(stmt.condition);
            this.addLine(`Then`);
            this.visitBlock(stmt.then);
            this.addLine(`Else`);
            this.visitBlock(stmt.else);
        } else if (statement.stmtType === ks.StatementType.Variable) {
            const stmt = <ks.VariableDeclaration> statement;
            this.addLine(`Variable: ${stmt.variableName}`);
            this.visitExpression(stmt.initializer);
        } else if (statement.stmtType === ks.StatementType.While) {
            const stmt = <ks.WhileStatement> statement;
            this.addLine(`While`);
            this.indent(1);
            this.visitExpression(stmt.condition);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === ks.StatementType.Foreach) {
            const stmt = <ks.ForeachStatement> statement;
            this.addLine(`Foreach ${stmt.varName}: ${stmt.varType.repr()}`);
            this.indent(1);
            this.addLine(`Items`);
            this.visitExpression(stmt.items);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === ks.StatementType.For) {
            const stmt = <ks.ForStatement> statement;
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

    visitBlock(block: ks.Block) {
        this.indent(1);

        for (const statement of block.statements) {
            this.add("- ");
            this.visitStatement(statement);
        }

        this.indent(-1);
    }

    visitUnknownExpression(expression: ks.Expression) {
        this.addLine(`${expression.exprKind} (unknown!)`);
    }

    visitExpression(expression: ks.Expression) {
        this.indent(1);
        
        this.add("- ");

        const addHdr = (line: string) => {
            this.addLine(`${line}` + (expression.valueType ? ` [${expression.valueType.repr()}]` : ""));
        };

        if (expression === null) {
            addHdr("<null>");
        } else if (expression.exprKind === ks.ExpressionKind.Binary) {
            const expr = <ks.BinaryExpression> expression;
            addHdr(`Binary: ${expr.operator}`);
            super.visitExpression(expression, null);
        } else if (expression.exprKind === ks.ExpressionKind.Identifier) {
            const expr = <ks.Identifier> expression;
            addHdr(`Identifier: ${expr.text}`);
        } else if (expression.exprKind === ks.ExpressionKind.Literal) {
            const expr = <ks.Literal> expression;
            const value = expr.literalType === "string" ? `"${expr.value}"` : expr.value;
            addHdr(`Literal (${expr.literalType}): ${value}`);
        } else if (expression.exprKind === ks.ExpressionKind.Unary) {
            const expr = <ks.UnaryExpression> expression;
            addHdr(`Unary (${expr.unaryType}): ${expr.operator}`);
            super.visitExpression(expression, null);
        } else if (expression.exprKind === ks.ExpressionKind.PropertyAccess) {
            const expr = <ks.PropertyAccessExpression> expression;
            addHdr(`PropertyAccess (.${expr.propertyName})`);
            super.visitExpression(expression, null);
        } else {
            addHdr(expression.exprKind);
            super.visitExpression(expression, null);
        }

        this.indent(-1);
    }

    generate() {
        for (const cls of this.codeGen.model.classes) {
            for (const method of cls.methods) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type}`).join(", ");
                this.addLine(`${cls.origName}::${method.origName}(${argList}): ${method.returnType}`);
                this.visitBlock(method.body);
                this.addLine("");
            }
        }
    }
}
