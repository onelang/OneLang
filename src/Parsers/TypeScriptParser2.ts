import * as one from "../StdLib/one";
import { OneAst as ast } from "../One/Ast";
import { Reader } from "./Common/Reader";
import { ExpressionParser } from "./Common/ExpressionParser";

export class TypeScriptParser2 {
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;

    constructor(source: string) {
        this.reader = new Reader(source);
        this.reader.errorCallback = error => {
            throw new Error(`[TypeScriptParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview}`);
        };
        this.expressionParser = new ExpressionParser(this.reader);
        this.expressionParser.unaryPrehook = () => this.parseExpressionToken();
    }

    parseType() {
        const typeName = this.reader.readIdentifier();

        let type: ast.Type;
        if (typeName === "string") {
            type = ast.Type.Class("TsString");
        } else if (typeName === "boolean") {
            type = ast.Type.Class("TsBoolean");
        } else if (typeName === "number") {
            type = ast.Type.Class("TsNumber");
        } else {
            type = ast.Type.Class(typeName);
            if (this.reader.readToken("<")) {
                do {
                    const generics = this.parseType();
                    type.typeArguments.push(generics);
                } while(this.reader.readToken(","));
                this.reader.expectToken(">");
            }
        }

        while (this.reader.readToken("[]"))
            type = ast.Type.Class("TsArray", [type]);

        return type;
    }

    parseExpression() {
        return this.expressionParser.parse();
    }

    parseExpressionToken(): ast.Expression {
        if (this.reader.readToken("`")) {
            const tmplStr = <ast.TemplateString> { exprKind: ast.ExpressionKind.TemplateString, parts: [] };
            while (true) {
                const litMatch = this.reader.readRegex("([^$`]|\\$[^{]|\\\\${|\\\\`)*");
                tmplStr.parts.push(<ast.TemplateStringPart> { literal: true, text: litMatch[0] });
                if (this.reader.readToken("`"))
                    break;
                else {
                    this.reader.expectToken("${");
                    const expr = this.parseExpression();
                    tmplStr.parts.push(<ast.TemplateStringPart> { literal: false, expr });
                    this.reader.expectToken("}");
                }
            }
            return tmplStr;
        } else if (this.reader.readToken("new")) {
            const type = this.parseType();
            this.reader.expectToken("(");
            const args = this.expressionParser.parseCallArguments();

            // TODO: shouldn't we use just one `type` field instead of `cls` and `typeArguments`?
            return <ast.NewExpression> {
                exprKind: ast.ExpressionKind.New,
                cls: <ast.Identifier> { text: type.className },
                typeArguments: type.typeArguments,
                arguments: args
            };
        } else if (this.reader.readToken("<")) {
            const castExpr = <ast.CastExpression> { exprKind: ast.ExpressionKind.Cast };
            castExpr.newType = this.parseType();
            this.reader.expectToken(">");
            castExpr.expression = this.parseExpression();
            return castExpr;
        }

        return null;
    }

    parseVarDeclTypeAndInit(varDecl: ast.VariableDeclaration, optional: boolean = false) {
        if (this.reader.readToken(":"))
            varDecl.type = this.parseType();

        if (this.reader.readToken("="))
            varDecl.initializer = this.parseExpression();

        if (!optional && varDecl.type === null && varDecl.initializer === null)
            this.reader.fail(`expected type declaration or initializer`);
    }

    parseBlockOrStatement() {
        const block = this.parseBlock();
        if (block !== null) return block;

        const stmt = this.parseStatement();
        if (stmt === null)
            this.reader.fail("expected block or statement");

        return <ast.Block> { statements: [stmt] };
    }

    parseStatement() {
        let statement: ast.Statement = null;

        const leadingTrivia = this.reader.readLeadingTrivia();

        let requiresClosing = true;
        const varDeclMatches = this.reader.readRegex("(const|let|var)\\b");
        if (varDeclMatches !== null) {
            const varDecl = statement = <ast.VariableDeclaration> { stmtType: ast.StatementType.VariableDeclaration };
            varDecl.name = this.reader.expectIdentifier("expected variable name");
            this.parseVarDeclTypeAndInit(varDecl);
        } else if (this.reader.readToken("delete")) {
            const unsetStmt = statement = <ast.UnsetStatement> { stmtType: ast.StatementType.Unset };
            unsetStmt.expression = this.parseExpression();
        } else if (this.reader.readToken("if")) {
            requiresClosing = false;
            const ifStmt = statement = <ast.IfStatement> { stmtType: ast.StatementType.If };
            this.reader.expectToken("(");
            ifStmt.condition = this.parseExpression();
            this.reader.expectToken(")");
            ifStmt.then = this.parseBlockOrStatement();
            if (this.reader.readToken("else"))
                ifStmt.else = this.parseBlockOrStatement();
        } else if (this.reader.readToken("while")) {
            requiresClosing = false;
            const whileStmt = statement = <ast.WhileStatement> { stmtType: ast.StatementType.While };
            this.reader.expectToken("(");
            whileStmt.condition = this.parseExpression();
            this.reader.expectToken(")");
            whileStmt.body = this.parseBlockOrStatement();
        } else if (this.reader.readToken("for")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const varDeclMod = this.reader.readAnyOf(["const", "let", "var"]);
            const itemVarName = this.reader.readIdentifier();
            if (this.reader.readToken("of")) {
                const foreachStmt = statement = <ast.ForeachStatement> { 
                    stmtType: ast.StatementType.Foreach,
                    itemVariable: <ast.VariableBase> { name: itemVarName }
                };
                foreachStmt.items = this.parseExpression();
                this.reader.expectToken(")");
                foreachStmt.body = this.parseBlockOrStatement();
            } else {
                const forStmt = statement = <ast.ForStatement> {
                    stmtType: ast.StatementType.For,
                    itemVariable: <ast.VariableDeclaration> { name: itemVarName }
                };
                this.parseVarDeclTypeAndInit(forStmt.itemVariable);
                this.reader.expectToken(";");
                forStmt.condition = this.parseExpression();
                this.reader.expectToken(";");
                forStmt.incrementor = this.parseExpression();
                this.reader.expectToken(")");
                forStmt.body = this.parseBlockOrStatement();
            }
        } else if (this.reader.readToken("return")) {
            const returnStmt = statement = <ast.ReturnStatement> { stmtType: ast.StatementType.Return };
            returnStmt.expression = this.reader.peekToken(";") ? null : this.parseExpression();
        } else if (this.reader.readToken("break")) {
            statement = <ast.Statement> { stmtType: ast.StatementType.Break };
        } else {
            const expr = this.parseExpression();
            statement = <ast.ExpressionStatement> { stmtType: ast.StatementType.ExpressionStatement, expression: expr };
            if (!(expr.exprKind === ast.ExpressionKind.Call ||
                (expr.exprKind === ast.ExpressionKind.Binary && ["=", "+=", "-="].includes((<ast.BinaryExpression> expr).operator)) ||
                (expr.exprKind === ast.ExpressionKind.Unary && ["++", "--"].includes((<ast.UnaryExpression> expr).operator))))
                this.reader.fail("this expression is not allowed as statement");
        }

        if (statement === null)
            this.reader.fail("unknown statement");

        statement.leadingTrivia = leadingTrivia;
        const statementLastLine = this.reader.wsLineCounter;
        if (!this.reader.readToken(";") && requiresClosing && this.reader.wsLineCounter === statementLastLine)
            this.reader.fail("statement is not closed");

        return statement;
    }

    parseBlock() {
        if (!this.reader.readToken("{")) return null;

        const block = <ast.Block> { statements: [] };
        if (this.reader.readToken("}")) return block;

        do {
            const statement = this.parseStatement();
            block.statements.push(statement);
        } while(!this.reader.readToken("}"));

        return block;
    }

    parseTypeArguments(): string[] {
        const typeArguments = [];
        if (this.reader.readToken("<")) {
            do {
                const generics = this.reader.readIdentifier();
                typeArguments.push(generics);
            } while(this.reader.readToken(","));
            this.reader.expectToken(">");
        }
        return typeArguments;
    }

    parseClass() {
        if (!this.reader.readToken("class")) return null;

        const cls = <ast.Class> { methods: {}, fields: {} };
        cls.name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${cls.name}`);

        cls.typeArguments = this.parseTypeArguments();

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? ast.Visibility.Private :
                modifiers.includes("protected") ? ast.Visibility.Protected : ast.Visibility.Public;

            const memberName = this.reader.readIdentifier();
            if (this.reader.readToken("(")) { // method
                const method = <ast.Method> { name: memberName, static: isStatic, visibility, leadingTrivia, parameters: [] };
                cls.methods[method.name] = method;
                this.context.push(`M:${method.name}`);

                const isConstructor = method.name === "constructor";
                if (!this.reader.readToken(")")) {
                    do {
                        const param = <ast.MethodParameter> {};
                        method.parameters.push(param);
    
                        const isPublic = isConstructor && this.reader.readToken("public");
                        param.name = this.reader.readIdentifier();
                        this.context.push(`arg:${param.name}`);
                        this.parseVarDeclTypeAndInit(param);
                        this.context.pop();
                    } while (this.reader.readToken(","));
    
                    this.reader.expectToken(")");
                }

                if (this.reader.readToken(":"))
                    method.returns = this.parseType();

                method.body = this.parseBlock();
                if (method.body === null)
                    this.reader.fail("method body is missing");

                this.context.pop();
            } else {
                const field = <ast.Field> { name: memberName, static: isStatic, visibility, leadingTrivia };
                cls.fields[field.name] = field;
                this.context.push(`F:${field.name}`);

                this.parseVarDeclTypeAndInit(field);
                this.reader.expectToken(";");

                this.context.pop();
            }
        }

        this.context.pop();
        return cls;
    }

    parseEnum() {
        if (!this.reader.readToken("enum")) return null;

        const enumObj = <ast.Enum> { values: [] };
        enumObj.name = this.reader.expectIdentifier("expected identifier after 'enum' keyword");
        this.context.push(`E:${enumObj.name}`);

        this.reader.expectToken("{");
        if (!this.reader.readToken("}")) {
            do {
                const enumMemberName = this.reader.readIdentifier();
                enumObj.values.push(<ast.EnumMember> { name: enumMemberName });
            } while(this.reader.readToken(","));
            this.reader.expectToken("}");
        }

        this.context.pop();
        return enumObj;
    }

    parseFile() {
        const schema = <ast.Schema> { classes: {}, enums: {} };
        while (!this.reader.eof) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const modifiers = this.reader.readModifiers(["export"]);

            const cls = this.parseClass();
            if (cls !== null) {
                cls.leadingTrivia = leadingTrivia;
                schema.classes[cls.name] = cls;
                continue;
            }

            const enumObj = this.parseEnum();
            if (enumObj !== null) {
                enumObj.leadingTrivia = leadingTrivia;
                schema.enums[enumObj.name] = enumObj;
                continue;
            }

            this.reader.fail("expected 'class' or 'enum' here");
        }
        return schema;
    }

    parse() {
        return this.parseFile();
    }
}