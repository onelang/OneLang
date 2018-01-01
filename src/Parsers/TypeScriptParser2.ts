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
        this.expressionParser = new ExpressionParser(this.reader);
        this.reader.errorCallback = error => {
            throw new Error(`[TypeScriptParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview}`);
        };
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

        const varDeclMatches = this.reader.readRegex("(const|let|var)\\b");
        if (varDeclMatches !== null) {
            const varDecl = statement = <ast.VariableDeclaration> { stmtType: ast.StatementType.VariableDeclaration };
            varDecl.name = this.reader.expectIdentifier("expected variable name");
            this.parseVarDeclTypeAndInit(varDecl);
        } else if (this.reader.readToken("delete")) {
            const unsetStmt = statement = <ast.UnsetStatement> { stmtType: ast.StatementType.Unset };
            unsetStmt.expression = this.parseExpression();
        } else if (this.reader.readToken("if")) {
            const ifStmt = statement = <ast.IfStatement> { stmtType: ast.StatementType.If };
            this.reader.expectToken("(");
            ifStmt.condition = this.parseExpression();
            this.reader.expectToken(")");
            ifStmt.then = this.parseBlockOrStatement();
            if (this.reader.readToken("else"))
                ifStmt.else = this.parseBlockOrStatement();
        } else if (this.reader.readToken("for")) {
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
            returnStmt.expression = this.parseExpression();
        } else {
            const expr = this.parseExpression();
            statement = <ast.ExpressionStatement> { stmtType: ast.StatementType.ExpressionStatement, expression: expr };
        }

        if (statement === null)
            this.reader.fail("unknown statement");

        statement.leadingTrivia = leadingTrivia;

        this.reader.readToken(";");
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

    tryToParseClass() {
        if (!this.reader.readToken("class")) return null;

        const cls = <ast.Class> { methods: {}, fields: {} };
        cls.name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${cls.name}`);

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

                if (!this.reader.readToken(")")) {
                    do {
                        const param = <ast.MethodParameter> {};
                        method.parameters.push(param);
    
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

    parseFile() {
        const schema = <ast.Schema> { classes: {} };
        while (!this.reader.eof) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const cls = this.tryToParseClass();
            if (cls === null)
                this.reader.fail("expected 'class' here");
            cls.leadingTrivia = leadingTrivia;
            schema.classes[cls.name] = cls;
        }
        return schema;
    }

    parse() {
        return this.parseFile();
    }
}