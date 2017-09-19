import { OneAst as one } from "./Ast";
import { AstVisitor } from "./AstVisitor";
import { SchemaContext } from "./SchemaContext";

export class OverviewGenerator extends AstVisitor<void> {
    result = "";
    pad = "";
    padWasAdded = false;
    showRefs = false;

    constructor() {
        super();
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
            this.addLine(`Variable: ${stmt.name}`);
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
            this.addLine(`Foreach ${stmt.itemVariable.name}: ${stmt.itemVariable.type && stmt.itemVariable.type.repr()}`);
            this.indent(1);
            this.addLine(`Items`);
            this.visitExpression(stmt.items);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.For) {
            const stmt = <one.ForStatement> statement;
            this.addLine(`For ("${stmt.itemVariable.name}")`);
            this.indent(1);
            this.addLine(`Condition`);
            this.visitExpression(stmt.condition);
            this.addLine(`Incrementor`);
            this.visitExpression(stmt.incrementor);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.Expression) {
            this.addLine(`ExpressionStatement`);
            super.visitStatement(statement, null);
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
        super.visitUnknownExpression(expression, null);
        this.addLine(`${expression.exprKind} (unknown!)`);
    }

    visitExpression(expression: one.Expression) {
        this.indent(1);
        
        this.add("- ");

        const addHdr = (line: string, postfix: string = "") => {
            const typeText = expression.valueType ? ` [${expression.valueType.repr()}]` : "";
            this.addLine(`${line}${typeText}${postfix}`);
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
        } else if (expression.exprKind === one.ExpressionKind.ClassReference) {
            const expr = <one.ClassReference> expression;
            addHdr(`ClassReference`);
        } else if (expression.exprKind === one.ExpressionKind.VariableReference) {
            const expr = <one.VariableRef> expression;
            addHdr(`${expr.varType}: ${expr.varRef.name}`, this.showRefs ? ` => ${expr.varRef.metaPath}` : "");
            if (expr.thisExpr)
                this.visitExpression(expr.thisExpr);
        } else if (expression.exprKind === one.ExpressionKind.MethodReference) {
            const expr = <one.MethodReference> expression;
            const specType = !expr.thisExpr ? "static" : 
                expr.thisExpr.exprKind === one.ExpressionKind.ThisReference ? "this" : null;
            addHdr(`MethodReference${specType ? ` (${specType})` : ""}`);
            if (!specType)
                this.visitExpression(expr.thisExpr);
        } else if (expression.exprKind === one.ExpressionKind.ThisReference) {
            const expr = <one.ThisReference> expression;
            addHdr(`ThisRef`);
        } else {
            addHdr(expression.exprKind);
            super.visitExpression(expression, null);
        }

        this.indent(-1);
    }

    generate(schemaCtx: SchemaContext) {
        if (this.result) return this.result;

        schemaCtx.ensureTransforms("fillName");

        for (const glob of Object.values(schemaCtx.schema.globals))
            this.addLine(`global ${glob.name}: ${glob.type.repr()}`);

        for (const cls of Object.values(schemaCtx.schema.classes)) {
            for (const field of Object.values(cls.fields))
                this.addLine(`${cls.name}::${field.name}: ${field.type.repr()}`);

            for (const prop of Object.values(cls.properties))
                this.addLine(`${cls.name}::${prop.name}: ${prop.type.repr()}`);

            for (const method of Object.values(cls.methods)) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type.repr()}`).join(", ");
                this.addLine(`${cls.name}::${method.name}(${argList}): ${method.returns.repr()}${method.static ? " [static]" : ""}`);
                this.visitBlock(method.body);
                this.addLine("");
            }
        }

        return this.result;
    }
}
