import * as one from "../StdLib/one";
import { OneAst as ast } from "../One/Ast";
import { Reader } from "./Common/Reader";
import { ExpressionParser } from "./Common/ExpressionParser";
import { NodeManager } from "./Common/NodeManager";
import { IParser } from "./Common/IParser";

export class TypeScriptParser2 implements IParser {
    langData: ast.ILangData = {
        langId: "typescript",
        literalClassNames: {
            string: "TsString",
            boolean: "TsBoolean",
            numeric: "TsNumber",
            character: "TsCharacter",
            map: "TsMap",
            array: "TsArray",
        },
        allowImplicitVariableDeclaration: false,
        supportsTemplateStrings: true,
        supportsFor: true,
    };

    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;
    nodeManager: NodeManager;

    constructor(source: string) {
        // TODO: less hacky way of removing test code?
        source = source.split("\ntry {")[0];
        source = source.replace(/one.Reflect.setupClass(.|\n)*?\n  \]\)\);\n/gm, "");
        source = source.replace(/const (\w+) = require\('\1'\);\n/gm, "");

        this.reader = new Reader(source);
        this.reader.errorCallback = error => {
            throw new Error(`[TypeScriptParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview}`);
        };
        this.nodeManager = new NodeManager(this.reader);
        this.expressionParser = this.createExpressionParser(this.reader, this.nodeManager);
    }

    createExpressionParser(reader: Reader, nodeManager: NodeManager = null) {
        const expressionParser = new ExpressionParser(reader, nodeManager);
        expressionParser.unaryPrehook = () => this.parseExpressionToken();
        return expressionParser;
    }

    parseType() {
        const typeName = this.reader.expectIdentifier();
        const startPos = this.reader.prevTokenOffset;

        let type: ast.Type;
        if (typeName === "string") {
            type = ast.Type.Class("TsString");
        } else if (typeName === "boolean") {
            type = ast.Type.Class("TsBoolean");
        } else if (typeName === "number") {
            type = ast.Type.Class("TsNumber");
        } else if (typeName === "any") {
            type = ast.Type.Any;
        } else if (typeName === "void") {
            type = ast.Type.Void;
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
            type = ast.Type.Class("TsArray", [type]);
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
            return <ast.Literal> { exprKind: "Literal", literalType: "boolean", value: true };
        } else if (this.reader.readToken("false")) {
            return <ast.Literal> { exprKind: "Literal", literalType: "boolean", value: false };
        } else if (this.reader.readToken("`")) {
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
                cls: <ast.Identifier> { exprKind: ast.ExpressionKind.Identifier, text: type.className },
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

        const mapLiteral = this.expressionParser.parseMapLiteral();
        if (mapLiteral != null) return mapLiteral;

        const arrayLiteral = this.expressionParser.parseArrayLiteral();
        if (arrayLiteral != null) return arrayLiteral;

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
        const startPos = this.reader.offset;

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
            const itemVarName = this.reader.expectIdentifier();
            if (this.reader.readToken("of") || this.reader.readToken("in")) {
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

    parseMethodSignature(method: ast.Method, cls: ast.Class, isConstructor: boolean, declarationOnly: boolean) {
        this.context.push(`M:${method.name}`);

        const bodyPrefixStatements: ast.Statement[] = [];
        if (!this.reader.readToken(")")) {
            do {
                const param = <ast.MethodParameter> {};
                method.parameters.push(param);

                this.reader.skipWhitespace();
                const paramStart = this.reader.offset;
                const isPublic = this.reader.readToken("public");
                if (isPublic && !isConstructor)
                    this.reader.fail("public modifier is only allowed in constructor definition");

                param.name = this.reader.expectIdentifier();
                this.context.push(`arg:${param.name}`);
                this.parseVarDeclTypeAndInit(param);

                if (isPublic) {
                    const field = <ast.Field> { name: param.name, type: param.type, initializer: param.initializer };
                    cls.fields[field.name] = field;
                    bodyPrefixStatements.push(this.parseExprStmtFromString(`this.${param.name} = ${param.name}`));
                }

                this.nodeManager.addNode(param, paramStart);
                this.context.pop();
            } while (this.reader.readToken(","));

            this.reader.expectToken(")");
        }

        method.returns = this.reader.readToken(":") ? this.parseType() : ast.Type.Any;

        if (declarationOnly) {
            this.reader.expectToken(";");
        } else {
            method.body = this.parseBlock();
            if (method.body === null)
                this.reader.fail("method body is missing");
            method.body.statements = [...bodyPrefixStatements, ...method.body.statements];
        }

        this.context.pop();
    }

    parseInterface() {
        if (!this.reader.readToken("interface")) return null;
        const intfStart = this.reader.prevTokenOffset;

        const intf = <ast.Interface> { methods: {}, baseInterfaces: [] };
        intf.name = this.reader.expectIdentifier("expected identifier after 'interface' keyword");
        this.context.push(`I:${intf.name}`);

        intf.typeArguments = this.parseTypeArguments();

        while (this.reader.readToken("extends"))
            intf.baseInterfaces.push(this.reader.expectIdentifier());

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const memberName = this.reader.expectIdentifier();
            const methodTypeArguments = this.parseTypeArguments();
            this.reader.expectToken("("); // method

            const method = <ast.Method> { name: memberName, leadingTrivia, parameters: [], typeArguments: methodTypeArguments };
            intf.methods[method.name] = method;

            this.parseMethodSignature(method, null, /* isConstructor = */ false, /* declarationOnly = */ true);
            this.nodeManager.addNode(method, memberStart);
        }

        this.nodeManager.addNode(intf, intfStart);
        this.context.pop();
        return intf;        
    }

    parseClass() {
        const clsModifiers = this.reader.readModifiers(["declare"]);
        const declarationOnly = clsModifiers.includes("declare");
        if (!this.reader.readToken("class")) return null;
        const clsStart = this.reader.prevTokenOffset;
        
        const cls = <ast.Class> { methods: {}, fields: {}, properties: {}, constructor: null, baseInterfaces: [] };
        cls.name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${cls.name}`);

        cls.typeArguments = this.parseTypeArguments();

        if (this.reader.readToken("extends"))
            cls.baseClass = this.reader.expectIdentifier();

        while (this.reader.readToken("implements"))
            cls.baseInterfaces.push(this.reader.expectIdentifier());

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? ast.Visibility.Private :
                modifiers.includes("protected") ? ast.Visibility.Protected : ast.Visibility.Public;

            const memberName = this.reader.expectIdentifier();
            const methodTypeArguments = this.parseTypeArguments();
            if (this.reader.readToken("(")) { // method
                const method = <ast.Method> { name: memberName, static: isStatic, visibility, leadingTrivia, parameters: [], typeArguments: methodTypeArguments };
                const isConstructor = memberName === "constructor";
                if (isConstructor)
                    cls.constructor = method;
                else
                    cls.methods[method.name] = method;

                this.parseMethodSignature(method, cls, isConstructor, declarationOnly);
                this.nodeManager.addNode(method, memberStart);
            } else if (memberName === "get" || memberName === "set") { // property
                const propName = this.reader.expectIdentifier();
                const prop = cls.properties[propName] || (cls.properties[propName] = <ast.Property> { name: propName });
                if (memberName === "get") {
                    this.context.push(`P[G]:${prop.name}`);
                    this.reader.expectToken("()", "expected '()' after property getter name");
                    if (this.reader.readToken(":"))
                        prop.type = this.parseType();
                    prop.getter = this.parseBlock();
                    if (!prop.getter)
                        this.reader.fail("property getter body is missing");
                } else {
                    this.context.push(`P[S]:${prop.name}`);
                    this.reader.expectIdentifier();
                    this.parseVarDeclTypeAndInit(<ast.VariableDeclaration>{});
                    prop.setter = this.parseBlock();
                    if (!prop.setter)
                        this.reader.fail("property setter body is missing");
                }
                this.nodeManager.addNode(prop, memberStart);
                this.context.pop();
            } else {
                const field = <ast.Field> { name: memberName, static: isStatic, visibility, leadingTrivia };
                cls.fields[field.name] = field;
                this.context.push(`F:${field.name}`);

                this.parseVarDeclTypeAndInit(field);
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
        const schema = <ast.Schema> { classes: {}, enums: {}, globals: {}, interfaces: {}, langData: this.langData, mainBlock: { statements: [] } };
        while (true) {
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

            const intf = this.parseInterface();
            if (intf !== null) {
                intf.leadingTrivia = leadingTrivia;
                schema.interfaces[intf.name] = intf;
                continue;
            }

            break;
        }

        this.reader.skipWhitespace();

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
        return new TypeScriptParser2(source).parse();
    }
}