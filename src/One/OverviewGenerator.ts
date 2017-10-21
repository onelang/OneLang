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

    protected visitVariable(stmt: one.VariableBase) {
        this.addLine(`- Variable: ${stmt.name}`);
    }

    visitStatement(statement: one.Statement) {
        const addHdr = (line: string) => {
            this.addLine(line);
        };

        if (statement.leadingTrivia) {
            this.addLine(`Comment: "${statement.leadingTrivia.replace(/\n/g, "\\n")}"`);
            this.add("- ");
        }
    
        if (statement === null) {
            addHdr("<null>");
        } else if (statement.stmtType === one.StatementType.If) {
            const stmt = <one.IfStatement> statement;
            addHdr(`If`);
            this.visitExpression(stmt.condition);
            this.indent(1);
            this.addLine(`Then`);
            this.visitBlock(stmt.then);
            this.addLine(`Else`);
            if (stmt.else)
                this.visitBlock(stmt.else);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.VariableDeclaration) {
            const stmt = <one.VariableDeclaration> statement;
            addHdr(`Variable: ${stmt.name}`);
            this.visitExpression(stmt.initializer);
        } else if (statement.stmtType === one.StatementType.While) {
            const stmt = <one.WhileStatement> statement;
            addHdr(`While`);
            this.indent(1);
            this.visitExpression(stmt.condition);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.Foreach) {
            const stmt = <one.ForeachStatement> statement;
            addHdr(`Foreach ${stmt.itemVariable.name}: ${stmt.itemVariable.type && stmt.itemVariable.type.repr()}`);
            this.indent(1);
            this.addLine(`Items`);
            this.visitExpression(stmt.items);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.For) {
            const stmt = <one.ForStatement> statement;
            addHdr(`For ("${stmt.itemVariable.name}")`);
            this.indent(1);
            this.addLine(`Var`);
            this.visitVariableDeclaration(stmt.itemVariable, null);
            this.addLine(`Condition`);
            this.visitExpression(stmt.condition);
            this.addLine(`Incrementor`);
            this.visitExpression(stmt.incrementor);
            this.addLine(`Body`);
            this.visitBlock(stmt.body);
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.ExpressionStatement) {
            addHdr(`ExpressionStatement`);
            super.visitStatement(statement, null);
        } else if (statement.stmtType === one.StatementType.Break) {
            addHdr(`Break`);
        } else {
            addHdr(`${statement.stmtType}`);
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
            const typeText = !expression ? " [null]" : 
                expression.valueType ? ` [${expression.valueType.repr()}]` : "";
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
            addHdr(`Literal (${expr.literalType}): ${JSON.stringify(expr.value)}`);
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
            const instanceField = expr.varType === one.VariableRefType.InstanceField;
            const specType = !instanceField ? null : !expr.thisExpr ? "static" : 
                expr.thisExpr.exprKind === one.ExpressionKind.ThisReference ? "this" : null;

            addHdr(`${expr.varType}${specType ? ` (${specType})` : ""}: ${expr.varRef.name}`, this.showRefs ? ` => ${expr.varRef.metaPath}` : "");
            if (!specType && expr.thisExpr)
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
        } else if (expression.exprKind === one.ExpressionKind.New) {
            const expr = <one.NewExpression> expression;
            const className = (<one.Identifier> expr.cls).text || (<one.ClassReference> expr.cls).classRef.name;
            const typeArgsText = expr.typeArguments ? `<${expr.typeArguments.join(", ")}>` : "";
            addHdr(`New ${className}${typeArgsText}`);
        } else if (expression.exprKind === one.ExpressionKind.MapLiteral) {
            const expr = <one.MapLiteral> expression;
            addHdr(expression.exprKind);
            this.indent(1);
            super.visitExpression(expression, null);
            this.indent(-1);
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
            for (const field of Object.values(cls.fields)) {
                this.addLine(`${cls.name}::${field.name}: ${field.type.repr()}`);
                if (field.initializer)
                    this.visitVariableDeclaration(field, null);
            }

            for (const prop of Object.values(cls.properties)) {
                this.addLine(`${cls.name}::${prop.name}: ${prop.type.repr()}`);
                this.visitBlock(prop.getter);
            }

            for (const method of Object.values(cls.methods)) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type.repr()}`).join(", ");
                this.addLine(`${cls.name}::${method.name}(${argList}): ${method.returns.repr()}${method.static ? " [static]" : ""}`);
                if (method.body)
                    this.visitBlock(method.body);
                else
                    this.addLine("  <no body>");
                this.addLine("");
            }
        }

        return this.result;
    }
}
