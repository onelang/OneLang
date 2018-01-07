import * as one from "../StdLib/one";
import { OneAst as ast } from "../One/Ast";
import { Reader } from "./Common/Reader";
import { ExpressionParser } from "./Common/ExpressionParser";
import { NodeManager } from "./Common/NodeManager";

export class CSharpParser {
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;
    nodeManager: NodeManager;

    constructor(source: string) {
        this.reader = new Reader(source);
        this.reader.errorCallback = error => {
            throw new Error(`[CSharpParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview}`);
        };
        this.nodeManager = new NodeManager(this.reader);
        this.expressionParser = this.createExpressionParser(this.reader, this.nodeManager);
    }

    createExpressionParser(reader: Reader, nodeManager: NodeManager = null) {
        const expressionParser = new ExpressionParser(reader, nodeManager);
        expressionParser.unaryPrehook = () => this.parseExpressionToken();
        expressionParser.literalClassNames = { string: "CsString", numeric: "CsNumber" };
        return expressionParser;
    }

    parseType() {
        const typeName = this.reader.expectIdentifier();
        const startPos = this.reader.prevTokenOffset;

        let type: ast.Type;
        if (typeName === "string") {
            type = ast.Type.Class("CsString");
        } else if (typeName === "boolean") {
            type = ast.Type.Class("CsBoolean");
        } else if (typeName === "number") {
            type = ast.Type.Class("CsNumber");
        } else if (typeName === "any") {
            type = ast.Type.Any;
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

        this.nodeManager.addNode(type, startPos);
        
        while (this.reader.readToken("[]")) {
            type = ast.Type.Class("CsArray", [type]);
            this.nodeManager.addNode(type, startPos);
        }

        return type;
    }

    parseExpression() {
        return this.expressionParser.parse();
    }

    parseExpressionToken(): ast.Expression {
        if (this.reader.readToken("null")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "null", value: "null" };
        } else if (this.reader.readToken("true")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "boolean", value: true, literalClassName: "TsBoolean" };
        } else if (this.reader.readToken("false")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "boolean", value: false, literalClassName: "TsBoolean" };
        } else if (this.reader.readToken("$\"")) {
            const tmplStr = <ast.TemplateString> { exprKind: ast.ExpressionKind.TemplateString, parts: [] };
            while (true) {
                const litMatch = this.reader.readRegex('([^{"]|\\{\\{|\\\\")*');
                tmplStr.parts.push(<ast.TemplateStringPart> { literal: true, text: litMatch[0] });
                if (this.reader.readToken('"'))
                    break;
                else {
                    this.reader.expectToken("{");
                    const expr = this.parseExpression();
                    tmplStr.parts.push(<ast.TemplateStringPart> { literal: false, expr });
                    this.reader.expectToken("}");
                }
            }
            return tmplStr;
        } else if (this.reader.readToken("new")) {
            const isArray = this.reader.readToken("[]");
            const type = isArray ? null : this.parseType();
            if ((isArray || type.className === "List") && this.reader.readToken("{")) {
                const arrayLiteral = <ast.ArrayLiteral> { items: [] };
                if (!this.reader.readToken("}")) {
                    do {
                        const item = this.parseExpression();
                        arrayLiteral.items.push(item);
                    } while (this.reader.readToken(","));
                    this.reader.expectToken("}");
                }
                return arrayLiteral;
            } else if (type.className === "Dictionary" && type.typeArguments[0].className === "CsString" && this.reader.readToken("{")) {
                const mapLiteral = <ast.MapLiteral> { properties: {} };
                if (!this.reader.readToken("}")) {
                    do {
                        this.reader.expectToken("{");
                        const key = this.reader.readString();
                        if (key === null)
                            this.reader.fail("expected string as map key");
                        this.reader.expectToken(",");
                        const value = this.parseExpression();
                        this.reader.expectToken("}");
                        mapLiteral.properties[key] = value;
                    } while (this.reader.readToken(","));
                    this.reader.expectToken("}");
                }
                return mapLiteral;
            } else {
                const newExpr = <ast.NewExpression> {
                    exprKind: ast.ExpressionKind.New,
                    // TODO: shouldn't we use just one `type` field instead of `cls` and `typeArguments`?
                    cls: <ast.Identifier> { exprKind: ast.ExpressionKind.Identifier, text: type.className },
                    typeArguments: type.typeArguments,
                    arguments: [],
                };

                this.reader.expectToken("(");
                newExpr.arguments = this.expressionParser.parseCallArguments();

                return newExpr;
            }
        } 
        // else if (this.reader.readToken("<")) {
        //     const castExpr = <ast.CastExpression> { exprKind: ast.ExpressionKind.Cast };
        //     castExpr.newType = this.parseType();
        //     this.reader.expectToken(">");
        //     castExpr.expression = this.parseExpression();
        //     return castExpr;
        // }

        return null;
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
        const startPos = this.reader.offset;

        let requiresClosing = true;
        if (this.reader.readToken("var")) {
            const varDecl = statement = <ast.VariableDeclaration> { stmtType: ast.StatementType.VariableDeclaration };
            varDecl.name = this.reader.expectIdentifier("expected variable name");
            if (this.reader.readToken("="))
                varDecl.initializer = this.parseExpression();
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
        } else if (this.reader.readToken("foreach")) {
            requiresClosing = false;
            const foreachStmt = statement = <ast.ForeachStatement> { stmtType: ast.StatementType.Foreach };
            this.reader.expectToken("(");
            this.reader.expectToken("var");
            foreachStmt.itemVariable = <ast.VariableBase> { name: this.reader.expectIdentifier() };
            this.reader.expectToken("in");
            foreachStmt.items = this.parseExpression();
            this.reader.expectToken(")");
            foreachStmt.body = this.parseBlockOrStatement();
        } else if (this.reader.readToken("for")) {
            requiresClosing = false;
            const forStmt = statement = <ast.ForStatement> { stmtType: ast.StatementType.For };
            this.reader.expectToken("(");

            // TODO: make it work without 'var', parse this as a statement?
            this.reader.expectToken("var");
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

    parseTypeArguments(): string[] {
        const typeArguments = [];
        if (this.reader.readToken("<")) {
            do {
                const generics = this.reader.expectIdentifier();
                typeArguments.push(generics);
            } while(this.reader.readToken(","));
            this.reader.expectToken(">");
        }
        return typeArguments;
    }

    parseExprStmtFromString(expression: string) {
        const expr = this.createExpressionParser(new Reader(expression)).parse();
        return <ast.ExpressionStatement> { stmtType: ast.StatementType.ExpressionStatement, expression: expr };
    }

    parseClass() {
        const clsModifiers = this.reader.readModifiers(["public"]);
        if (!this.reader.readToken("class")) return null;
        const clsStart = this.reader.prevTokenOffset;
        
        const cls = <ast.Class> { methods: {}, fields: {}, properties: {}, constructor: null };
        cls.name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${cls.name}`);

        cls.typeArguments = this.parseTypeArguments();

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? ast.Visibility.Private :
                modifiers.includes("protected") ? ast.Visibility.Protected : ast.Visibility.Public;

            const memberType = this.parseType();
            const isConstructor = memberType.isClass && memberType.className === cls.name;
            const memberName = isConstructor ? cls.name : this.reader.expectIdentifier();
            const methodTypeArguments = this.parseTypeArguments();
            const isMethod = this.reader.readToken("(");
            // if the class (eg. MyClass) contains a field "public MyClass Child" then we thought it's a constructor, 
            //   so we did not read the field name ("Child") yet
            const fieldName = !isMethod && isConstructor ? this.reader.expectIdentifier() : memberName;
            if (isMethod) { // method
                const method = <ast.Method> { name: memberName, returns: memberType, static: isStatic, visibility, leadingTrivia, parameters: [], typeArguments: methodTypeArguments };
                if (isConstructor)
                    cls.constructor = method;
                else
                    cls.methods[method.name] = method;
                this.context.push(`M:${method.name}`);

                if (!this.reader.readToken(")")) {
                    do {
                        const param = <ast.MethodParameter> {};
                        method.parameters.push(param);

                        this.reader.skipWhitespace();
                        const paramStart = this.reader.offset;
                        param.type = this.parseType();
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
            } else if (this.reader.readToken("{")) { // property
                this.reader.fail("properties are not implemented yet");
            } else {
                const field = <ast.Field> { name: fieldName, type: memberType, static: isStatic, visibility, leadingTrivia };
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

    parseEnum() {
        if (!this.reader.readToken("enum")) return null;
        const enumStart = this.reader.prevTokenOffset;

        const enumObj = <ast.Enum> { values: [] };
        enumObj.name = this.reader.expectIdentifier("expected identifier after 'enum' keyword");
        this.context.push(`E:${enumObj.name}`);

        this.reader.expectToken("{");
        if (!this.reader.readToken("}")) {
            do {
                if (this.reader.peekToken("}")) break; // eg. "enum { A, B, }" (but multiline)

                const enumMemberName = this.reader.expectIdentifier();
                const enumMember = <ast.EnumMember> { name: enumMemberName };
                this.nodeManager.addNode(enumMember, this.reader.prevTokenOffset);
                enumObj.values.push(enumMember);

                // TODO: generated code compatibility
                this.reader.readToken(`= "${enumMemberName}"`);
            } while(this.reader.readToken(","));
            this.reader.expectToken("}");
        }

        this.nodeManager.addNode(enumObj, enumStart);
        this.context.pop();
        return enumObj;
    }

    parseSchema() {
        const schema = <ast.Schema> { classes: {}, enums: {}, globals: {} };

        const usings = [];
        while (this.reader.readToken("using")) {
            usings.push(this.parseExpression());
            this.reader.expectToken(";");
        }

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
        return this.parseSchema();
    }

    static parseFile(source: string) {
        return new CSharpParser(source).parse();
    }
}