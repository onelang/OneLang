import * as one from "../StdLib/one";
import { OneAst as ast } from "../One/Ast";
import { Reader } from "./Common/Reader";
import { ExpressionParser } from "./Common/ExpressionParser";
import { NodeManager } from "./Common/NodeManager";
import { IParser } from "./Common/IParser";

export class PhpParser implements IParser {
    langData: ast.ILangData = { 
        literalClassNames: {
            string: "PhpString",
            boolean: "PhpBoolean",
            numeric: "PhpNumber",
            character: "PhpCharacter",
            map: "PhpMap",
            array: "PhpArray",
        },
        allowImplicitVariableDeclaration: true,
        supportsTemplateStrings: false
    };
    
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;
    nodeManager: NodeManager;

    constructor(source: string) {
        // TODO: less hacky way of removing test code?
        source = source.split("\ntry {\n    $c = new TestClass")[0];
        source = source.replace(/OneReflect::setupClass(.|\n)*?\n  \]\)\);\n/gm, "");        

        this.reader = new Reader(source);
        this.reader.identifierRegex = "\\$?[A-Za-z_][A-Za-z0-9_]*";
        this.reader.errorCallback = error => {
            throw new Error(`[PhpParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview}`);
        };
        this.nodeManager = new NodeManager(this.reader);

        const exprConf = ExpressionParser.defaultConfig();
        exprConf.propertyAccessOps = ["->", "::"];
        exprConf.precedenceLevels.find(x => x.name === "sum").operators.push(".");
        exprConf.precedenceLevels.find(x => x.name === "assignment").operators.push(".=");

        this.expressionParser = new ExpressionParser(this.reader, this.nodeManager, exprConf);
        this.expressionParser.unaryPrehook = () => this.parseExpressionToken();
        this.expressionParser.infixPrehook = (left: ast.Expression) => this.parseInfix(left);
    }

    parseExpression() {
        return this.expressionParser.parse();
    }

    parseInfix(left: ast.Expression) {
        if (this.reader.readToken("[]")) {
            this.reader.expectToken("=");
            const newItem = this.expressionParser.parse();
            return <ast.CallExpression> { exprKind: ast.ExpressionKind.Call,
                method: <ast.PropertyAccessExpression> { exprKind: ast.ExpressionKind.PropertyAccess,
                    object: left,
                    propertyName: "Add",
                },
                arguments: [newItem]
            };
        }

        return null;
    }

    parseExpressionToken(): ast.Expression {
        if (this.reader.readToken("null")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "null", value: "null" };
        } else if (this.reader.readToken("true")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "boolean", value: true };
        } else if (this.reader.readToken("false")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "boolean", value: false };
        } else if (this.reader.readToken("this")) {
            return <ast.Identifier> { exprKind: "Identifier", text: "this" };
        // TODO: template string
        //} else if (this.reader.readToken('"')) {
        //    this.reader.commentDisabled = true;
        //    const tmplStr = <ast.TemplateString> { exprKind: ast.ExpressionKind.TemplateString, parts: [] };
        //    while (true) {
        //        const litMatch = this.reader.readRegex('(\\\\"|\\\\#|[^"#])*');
        //        tmplStr.parts.push(<ast.TemplateStringPart> { literal: true, text: litMatch[0] });
        //        if (this.reader.readToken('"'))
        //            break;
        //        else {
        //            this.reader.expectToken("#{");
        //            this.reader.commentDisabled = false;
        //            const expr = this.parseExpression();
        //            tmplStr.parts.push(<ast.TemplateStringPart> { literal: false, expr });
        //            this.reader.commentDisabled = true;
        //            this.reader.expectToken("}");
        //        }
        //    }
        //    this.reader.commentDisabled = false;
        //
        //    if (tmplStr.parts.length === 1)
        //        return <ast.Literal> { exprKind: "Literal", literalType: "string", value: tmplStr.parts[0].text };
        //
        //    return tmplStr;
        } else if (this.reader.readToken("array")) {
            const arrayTypePeeker = this.reader.clone();
            if (!arrayTypePeeker.readToken("("))
                return <ast.Identifier> { exprKind: "Identifier", text: "array" };
            const isMap = arrayTypePeeker.readString() && arrayTypePeeker.readToken("=>");
            if (isMap) {
                const mapLiteral = this.expressionParser.parseMapLiteral("=>", "(", ")");
                return mapLiteral;
            } else {
                const arrayLiteral = this.expressionParser.parseArrayLiteral("(", ")");
                return arrayLiteral;
            }
        } else if (this.reader.readToken("new")) {
            const className = this.reader.expectIdentifier();
            const newExpr = <ast.NewExpression> { exprKind: ast.ExpressionKind.New,
                // TODO: shouldn't we use just one `type` field instead of `cls` and `typeArguments`?
                cls: <ast.Identifier> { exprKind: ast.ExpressionKind.Identifier, text: className },
                typeArguments: [],
            };

            this.reader.expectToken("(");
            newExpr.arguments = this.expressionParser.parseCallArguments();
            return newExpr;
        }

        const arrayLiteral = this.expressionParser.parseArrayLiteral();
        if (arrayLiteral != null) return arrayLiteral;

        return null;
    }

    parseIf(): ast.IfStatement {
        const ifStmt = <ast.IfStatement> { stmtType: ast.StatementType.If, then: <ast.Block> { statements: [] } };
        this.reader.expectToken("(");
        ifStmt.condition = this.parseExpression();
        this.reader.expectToken(")");
        ifStmt.then = this.parseBlockOrStatement();
        if (this.reader.readToken("elseif")) {
            ifStmt.else = <ast.Block> { statements: [this.parseIf()] };
        } else if (this.reader.readToken("else")) {
            ifStmt.else = this.parseBlockOrStatement();
        }
        return ifStmt;
    }

    parseStatement() {
        let statement: ast.Statement = null;

        const leadingTrivia = this.reader.readLeadingTrivia();
        const startPos = this.reader.offset;

        let requiresClosing = true;
        if (this.reader.readToken("unset")) {
            const unsetStmt = statement = <ast.UnsetStatement> { stmtType: ast.StatementType.Unset };
            unsetStmt.expression = this.parseExpression();
        } else if (this.reader.readToken("if")) {
            requiresClosing = false;
            const ifStmt = statement = this.parseIf();
        } else if (this.reader.readToken("while")) {
            requiresClosing = false;
            const whileStmt = statement = <ast.WhileStatement> { stmtType: ast.StatementType.While };
            this.reader.expectToken("(");
            whileStmt.condition = this.parseExpression();
            this.reader.expectToken(")");
            whileStmt.body = this.parseBlockOrStatement();
        } else if (this.reader.readToken("foreach")) {
            requiresClosing = false;
            const foreachStmt = statement = <ast.ForeachStatement> { stmtType: ast.StatementType.Foreach };
            this.reader.expectToken("(");
            foreachStmt.items = this.parseExpression();
            this.reader.expectToken("as");
            foreachStmt.itemVariable = <ast.VariableBase> { name: this.reader.expectIdentifier() };
            this.reader.expectToken(")");
            foreachStmt.body = this.parseBlockOrStatement();
        } else if (this.reader.readToken("for")) {
            requiresClosing = false;
            const forStmt = statement = <ast.ForStatement> { stmtType: ast.StatementType.For };
            this.reader.expectToken("(");

            forStmt.itemVariable = <ast.VariableDeclaration> { name: this.reader.expectIdentifier() };
            if (this.reader.readToken("="))
                forStmt.itemVariable.initializer = this.parseExpression();

            this.reader.expectToken(";");
            forStmt.condition = this.parseExpression();
            this.reader.expectToken(";");
            forStmt.incrementor = this.parseExpression();
            this.reader.expectToken(")");
            forStmt.body = this.parseBlockOrStatement();
        } else if (this.reader.readToken("return")) {
            const returnStmt = statement = <ast.ReturnStatement> { stmtType: ast.StatementType.Return };
            returnStmt.expression = this.reader.peekToken(";") ? null : this.parseExpression();
        } else if (this.reader.readToken("throw")) {
            const throwStmt = statement = <ast.ThrowStatement> { stmtType: ast.StatementType.Throw };
            throwStmt.expression = this.parseExpression();
        } else if (this.reader.readToken("break")) {
            statement = <ast.Statement> { stmtType: ast.StatementType.Break };
        } else if (this.reader.readToken("print")) {
            // TODO hack: we shouldn't probably support unset statement if we don't support print statement
            const callExprStmt = statement = this.parseExprStmtFromString("OneConsole.print()");
            const callExpr = <ast.CallExpression> callExprStmt.expression;
            let callArgExpr = this.parseExpression();

            // TODO hack: print($value . "\n")   =>   print($value)
            if (callArgExpr.exprKind === "Parenthesized")
                callArgExpr = (<ast.ParenthesizedExpression> callArgExpr).expression;
            if (callArgExpr.exprKind === "Binary") {
                const binaryExpr = <ast.BinaryExpression> callArgExpr;
                if (binaryExpr.operator === "." && binaryExpr.right.exprKind === "Literal" && (<ast.Literal> binaryExpr.right).value === "\n")
                    callArgExpr = binaryExpr.left;
            }
            if (callArgExpr.exprKind === "Parenthesized")
                callArgExpr = (<ast.ParenthesizedExpression> callArgExpr).expression;

            callExpr.arguments.push(callArgExpr);
        } else {
            const expr = this.parseExpression();
            statement = <ast.ExpressionStatement> { stmtType: ast.StatementType.ExpressionStatement, expression: expr };
            if (!(expr.exprKind === ast.ExpressionKind.Call ||
                (expr.exprKind === ast.ExpressionKind.Binary && ["=", "+=", "-=", ".="].includes((<ast.BinaryExpression> expr).operator)) ||
                (expr.exprKind === ast.ExpressionKind.Unary && ["++", "--"].includes((<ast.UnaryExpression> expr).operator))))
                this.reader.fail("this expression is not allowed as statement");
        }

        if (statement === null)
            this.reader.fail("unknown statement");

        statement.leadingTrivia = leadingTrivia;
        this.nodeManager.addNode(statement, startPos);

        const statementLastLine = this.reader.wsLineCounter;
        if (!this.reader.readToken(";") && requiresClosing && this.reader.wsLineCounter === statementLastLine)
            this.reader.fail("statement is not closed");

        return statement;
    }

    parseBlock() {
        if (!this.reader.readToken("{")) return null;
        const startPos = this.reader.prevTokenOffset;

        const block = <ast.Block> { statements: [] };
        if (this.reader.readToken("}")) return block;

        do {
            const statement = this.parseStatement();
            block.statements.push(statement);
        } while(!this.reader.readToken("}"));

        this.nodeManager.addNode(block, startPos);
        return block;
    }

    parseBlockOrStatement() {
        const block = this.parseBlock();
        if (block !== null) return block;

        const stmt = this.parseStatement();
        if (stmt === null)
            this.reader.fail("expected block or statement");

        return <ast.Block> { statements: [stmt] };
    }

    parseExprFromString(expression: string) {
        const expr = new ExpressionParser(new Reader(expression)).parse();
        return expr;
    }

    parseExprStmtFromString(expression: string) {
        const expr = this.parseExprFromString(expression);
        return <ast.ExpressionStatement> { stmtType: ast.StatementType.ExpressionStatement, expression: expr };
    }

    parseClass() {
        if (!this.reader.readToken("class")) return null;
        const clsStart = this.reader.prevTokenOffset;
        
        const cls = <ast.Class> { methods: {}, fields: {}, properties: {}, constructor: null, typeArguments: [], baseInterfaces: [] };
        cls.name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${cls.name}`);

        if (this.reader.readToken("extends"))
            cls.baseClass = this.reader.expectIdentifier();

        while (this.reader.readToken("implements"))
            cls.baseInterfaces.push(this.reader.expectIdentifier());

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private", "const"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? ast.Visibility.Private :
                modifiers.includes("protected") ? ast.Visibility.Protected : ast.Visibility.Public;
            
            if (this.reader.readToken("function")) {
                const method = <ast.Method> { leadingTrivia, static: isStatic, visibility, parameters: [], returns: ast.Type.Any };
                method.name = this.reader.expectIdentifier();
                cls.methods[method.name] = method;
                this.context.push(`M:${method.name}`);

                this.reader.expectToken("(");
                if (!this.reader.readToken(")")) {
                    do {
                        const param = <ast.MethodParameter> {};
                        method.parameters.push(param);

                        this.reader.skipWhitespace();
                        const paramStart = this.reader.offset;
                        param.name = this.reader.expectIdentifier();

                        this.context.push(`arg:${param.name}`);
                        this.nodeManager.addNode(param, paramStart);
                        this.context.pop();
                    } while (this.reader.readToken(","));
                    this.reader.expectToken(")");
                }

                method.body = this.parseBlock();
                if (method.body === null)
                    this.reader.fail("method body is missing");

                this.nodeManager.addNode(method, memberStart);
                this.context.pop();
            } else {
                const fieldName = this.reader.readIdentifier();
                const field = <ast.Field> { name: fieldName, static: isStatic, visibility, leadingTrivia };
                cls.fields[field.name] = field;
                this.context.push(`F:${field.name}`);

                if (this.reader.readToken("="))
                    field.initializer = this.parseExpression();
                this.reader.expectToken(";");

                this.nodeManager.addNode(field, memberStart);
                this.context.pop();

            }
        }

        this.nodeManager.addNode(cls, clsStart);
        this.context.pop();
        return cls;
    }

    parseSchema() {
        const schema = <ast.Schema> { classes: {}, enums: {}, globals: {}, interfaces: {}, langData: this.langData, mainBlock: { statements: [] }  };

        this.reader.readRegex("<\\?php\\s*");

        const usings = [];
        while (this.reader.readToken("require"))
            usings.push(this.parseExpression());

        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const cls = this.parseClass();
            if (cls !== null) {
                cls.leadingTrivia = leadingTrivia;
                schema.classes[cls.name] = cls;
                continue;
            }

            break;
        }

        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const stmt = this.parseStatement();
            if (stmt === null)
                this.reader.fail("expected 'class', 'enum' or 'interface' or a statement here");

            stmt.leadingTrivia = leadingTrivia;
            schema.mainBlock.statements.push(stmt);
        }

        return schema;
    }

    parse() {
        return this.parseSchema();
    }

    static parseFile(source: string) {
        return new PhpParser(source).parse();
    }
}