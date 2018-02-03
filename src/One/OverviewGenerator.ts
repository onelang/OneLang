import { OneAst as one } from "./Ast";
import { AstVisitor } from "./AstVisitor";
import { SchemaContext } from "./SchemaContext";

export class OverviewGenerator extends AstVisitor<void> {
    result = "";
    pad = "";
    padWasAdded = false;
    showRefs = false;
    lastLineWasNewLine = true;

    constructor() {
        super();
    }

    addLine(line: string) {
        this.add(`${line}\n`);
        this.padWasAdded = false;
        this.lastLineWasNewLine = false;
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

    newLine() {
        if (!this.lastLineWasNewLine)
            this.result += "\n";
        this.lastLineWasNewLine = true;
    }

    protected visitVariable(stmt: one.VariableBase) {
        this.addLine(`- Variable: ${stmt.name}${stmt.type ? ` [${stmt.type.repr()}]` : ""}`);
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
            if (stmt.else) {
                this.addLine(`Else`);
                this.visitBlock(stmt.else);
            }
            this.indent(-1);
        } else if (statement.stmtType === one.StatementType.VariableDeclaration) {
            const stmt = <one.VariableDeclaration> statement;
            addHdr(`Variable: ${stmt.name}${stmt.type ? ` [${stmt.type.repr()}]` : ""}`);
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
        } else if (statement.stmtType === one.StatementType.Unset) {
            const unsetStmt = <one.UnsetStatement> statement;
            addHdr(`Unset`);
            super.visitExpression(unsetStmt.expression, null);
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

            const throws = expr.methodRef && expr.methodRef.throws;
            const addInfo = [specType, throws ? "throws" : null].filter(x => x);

            addHdr(`MethodReference${addInfo.length > 0 ? ` (${addInfo.join(", ")})` : ""}`);
            if (!specType)
                this.visitExpression(expr.thisExpr);
        } else if (expression.exprKind === one.ExpressionKind.ThisReference) {
            const expr = <one.ThisReference> expression;
            addHdr(`ThisRef`);
        } else if (expression.exprKind === one.ExpressionKind.New) {
            const expr = <one.NewExpression> expression;
            const className = (<one.Identifier> expr.cls).text || (<one.ClassReference> expr.cls).classRef.name;
            const typeArgsText = expr.typeArguments && expr.typeArguments.length > 0 ? `<${expr.typeArguments.join(", ")}>` : "";
            addHdr(`New ${className}${typeArgsText}`);
        } else if (expression.exprKind === one.ExpressionKind.Cast) {
            const expr = <one.CastExpression> expression;
            addHdr(`Cast -> ${expr.newType.repr()}`);
            super.visitExpression(expr.expression, null);
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
        this.newLine();

        for (const _enum of Object.values(schemaCtx.schema.enums))
            this.addLine(`enum ${_enum.name}: ${_enum.values.map(x => x.name).join(', ')}`);
        this.newLine();
                
        for (const cls of Object.values(schemaCtx.schema.classes)) {
            for (const field of Object.values(cls.fields)) {
                this.addLine(`${cls.name}::${field.name}: ${field.type && field.type.repr() || "null"}`);
                if (field.initializer) {
                    this.visitVariableDeclaration(field, null);
                    this.newLine();
                }
            }
            this.newLine();

            for (const prop of Object.values(cls.properties)) {
                this.addLine(`${cls.name}::${prop.name}: ${prop.type && prop.type.repr() || "null"}`);
                this.visitBlock(prop.getter);
            }
            this.newLine();

            if (cls.constructor) {
                this.addLine(`${cls.name}::constructor`);
                this.visitBlock(cls.constructor.body);
            }
            this.newLine();

            for (const method of Object.values(cls.methods)) {
                const argList = method.parameters.map(arg => `${arg.name}: ${arg.type ? arg.type.repr() : "???"}`).join(", ");
                const addInfo = [method.static ? "static" : null, method.throws ? "throws" : null].filter(x => x);

                this.addLine(`${cls.name}::${method.name}(${argList}): ${method.returns ? method.returns.repr() : "???"}`
                    +`${addInfo.length > 0 ? ` [${addInfo.join(", ")}]` : ""}`);

                if (method.body)
                    this.visitBlock(method.body);
                else
                    this.addLine("  <no body>");
                this.newLine();
            }
        }

        if (schemaCtx.schema.mainBlock.statements.length > 0) {
            this.addLine(`main()`);
            this.visitBlock(schemaCtx.schema.mainBlock);
        }

        return this.result;
    }
}
