import { KSLangSchema as ks } from "./KSLangSchema";
import { CodeGenerator } from "./CodeGenerator";

export class OverviewGenerator {
    result = "";
    pad = "";
    padWasAdded = false;

    constructor(public codeGen: CodeGenerator) {
        this.generate();
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

    printBlock(block: ks.Block) {
        this.indent(1);

        for (const statement of block.statements) {
            this.add("- ");
            if (statement === null) {
                this.addLine("<null>");
            } else if (statement.stmtType === ks.StatementType.Return) {
                const stmt = <ks.ReturnStatement> statement;
                this.addLine(`Return`);
                this.printExpression(stmt.expression);
            } else if (statement.stmtType === ks.StatementType.Expression) {
                const stmt = <ks.ExpressionStatement> statement;
                this.addLine(`Expression`);
                this.printExpression(stmt.expression);
            } else if (statement.stmtType === ks.StatementType.If) {
                const stmt = <ks.IfStatement> statement;
                this.addLine(`If`);
                this.printExpression(stmt.condition);
                this.addLine(`Then`);
                this.printBlock(stmt.then);
                this.addLine(`Else`);
                this.printBlock(stmt.else);
            } else if (statement.stmtType === ks.StatementType.Throw) {
                const stmt = <ks.ThrowStatement> statement;
                this.printExpression(stmt.expression);
            } else if (statement.stmtType === ks.StatementType.Variable) {
                const stmt = <ks.VariableDeclaration> statement;
                this.addLine(`Variable: ${stmt.variableName}`);
                this.printExpression(stmt.initializer);
            } else if (statement.stmtType === ks.StatementType.While) {
                const stmt = <ks.WhileStatement> statement;
                this.addLine(`While`);
                this.indent(1);
                this.printExpression(stmt.condition);
                this.addLine(`Body`);
                this.printBlock(stmt.body);
                this.indent(-1);
            } else if (statement.stmtType === ks.StatementType.Foreach) {
                const stmt = <ks.ForeachStatement> statement;
                this.addLine(`Foreach ${stmt.varName}: ${stmt.varType.repr()}`);
                this.indent(1);
                this.addLine(`Items`);
                this.printExpression(stmt.items);
                this.addLine(`Body`);
                this.printBlock(stmt.body);
                this.indent(-1);
            } else if (statement.stmtType === ks.StatementType.For) {
                const stmt = <ks.ForStatement> statement;
                this.addLine(`For ("${stmt.itemVariable.variableName}")`);
                this.indent(1);
                this.addLine(`Condition`);
                this.printExpression(stmt.condition);
                this.addLine(`Incrementor`);
                this.printExpression(stmt.incrementor);
                this.addLine(`Body`);
                this.printBlock(stmt.body);
                this.indent(-1);
            } else {
                console.log(`Unknown statement type: ${statement.stmtType}`);
                this.addLine(`${statement.stmtType} (unknown!)`);
            }
        }

        this.indent(-1);
    }

    printExpression(expression: ks.Expression) {
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
            this.printExpression(expr.left);
            this.printExpression(expr.right);
        } else if (expression.exprKind === ks.ExpressionKind.Call) {
            const expr = <ks.CallExpression> expression;
            addHdr(`Call`);
            this.printExpression(expr.method);
            for (const arg of expr.arguments)
                this.printExpression(arg);
        } else if (expression.exprKind === ks.ExpressionKind.Conditional) {
            const expr = <ks.ConditionalExpression> expression;
            addHdr(`Conditional`);
            this.printExpression(expr.condition);
            this.printExpression(expr.whenTrue);
            this.printExpression(expr.whenFalse);
        } else if (expression.exprKind === ks.ExpressionKind.Identifier) {
            const expr = <ks.Identifier> expression;
            addHdr(`Identifier: ${expr.text}`);
        } else if (expression.exprKind === ks.ExpressionKind.New) {
            const expr = <ks.NewExpression> expression;
            addHdr(`New`);
            this.printExpression(expr.class);
            for (const arg of expr.arguments)
                this.printExpression(arg);
        } else if (expression.exprKind === ks.ExpressionKind.Literal) {
            const expr = <ks.Literal> expression;
            const value = expr.literalType === "string" ? `"${expr.value}"` : expr.value;
            addHdr(`Literal (${expr.literalType}): ${value}`);
        } else if (expression.exprKind === ks.ExpressionKind.Parenthesized) {
            const expr = <ks.ParenthesizedExpression> expression;
            addHdr(`Parenthesized`);
            this.printExpression(expr.expression);
        } else if (expression.exprKind === ks.ExpressionKind.Unary) {
            const expr = <ks.UnaryExpression> expression;
            addHdr(`Unary (${expr.unaryType}): ${expr.operator}`);
            this.printExpression(expr.operand);
        } else if (expression.exprKind === ks.ExpressionKind.PropertyAccess) {
            const expr = <ks.PropertyAccessExpression> expression;
            addHdr(`PropertyAccess (.${expr.propertyName})`);
            this.printExpression(expr.object);
        } else if (expression.exprKind === ks.ExpressionKind.ElementAccess) {
            const expr = <ks.ElementAccessExpression> expression;
            addHdr(`ElementAccess`);
            this.printExpression(expr.object);
            this.printExpression(expr.elementExpr);
        } else if (expression.exprKind === ks.ExpressionKind.ArrayLiteral) {
            const expr = <ks.ArrayLiteralExpression> expression;
            addHdr(`ArrayLiteral`);
            for (const item of expr.items)
                this.printExpression(item);
        } else {
            console.log(`Unknown expression type: ${expression.exprKind}`);
            this.addLine(`${expression.exprKind} (unknown!)`);
        }

        this.indent(-1);
    }

    generate() {
        for (const cls of this.codeGen.model.classes) {
            for (const method of cls.methods) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type}`).join(", ");
                this.addLine(`${cls.origName}::${method.origName}(${argList}): ${method.returnType}`);
                this.printBlock(method.body);
                this.addLine("");
            }
        }
    }
}
