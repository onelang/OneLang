import { Reader } from "./Common/Reader";
import { ExpressionParser } from "./Common/ExpressionParser";
import { NodeManager } from "./Common/NodeManager";
import { IParser } from "./Common/IParser";
import { Type, AnyType, VoidType, UnresolvedType } from "../One/Ast/AstTypes";
import { Expression, Literal, TemplateString, TemplateStringPart, NewExpression, Identifier, CastExpression, NullLiteral, BooleanLiteral, CallExpression, BinaryExpression, UnaryExpression } from "../One/Ast/Expressions";
import { VariableDeclaration, Statement, UnsetStatement, IfStatement, WhileStatement, ForeachStatement, ForStatement, ReturnStatement, ThrowStatement, BreakStatement, ExpressionStatement, ForeachVariable, ForVariable } from "../One/Ast/Statements";
import { Block, Class, Method, MethodParameter, Field, Visibility, SourceFile, Property, Constructor, Interface, EnumMember, Enum, IMethodBase, Import } from "../One/Ast/Types";

export class TypeScriptParser2 implements IParser {
    // langData: LangData = {
    //     langId: "typescript",
    //     literalClassNames: {
    //         string: "TsString",
    //         boolean: "TsBoolean",
    //         numeric: "TsNumber",
    //         character: "TsCharacter",
    //         map: "TsMap",
    //         array: "TsArray",
    //     },
    //     allowImplicitVariableDeclaration: false,
    //     supportsTemplateStrings: true,
    //     supportsFor: true,
    // };

    sourceFile: SourceFile;
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;
    nodeManager: NodeManager;

    constructor(source: string) {
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

        let type: Type;
        if (typeName === "string") {
            type = new UnresolvedType("TsString");
        } else if (typeName === "boolean") {
            type = new UnresolvedType("TsBoolean");
        } else if (typeName === "number") {
            type = new UnresolvedType("TsNumber");
        } else if (typeName === "any") {
            type = new AnyType();
        } else if (typeName === "void") {
            type = new VoidType();
        } else {
            const typeArguments: Type[] = [];
            if (this.reader.readToken("<")) {
                do {
                    const generics = this.parseType();
                    typeArguments.push(generics);
                } while(this.reader.readToken(","));
                this.reader.expectToken(">");
            }
            type = new UnresolvedType(typeName, typeArguments);
        }

        this.nodeManager.addNode(type, startPos);
        
        while (this.reader.readToken("[]")) {
            type = new UnresolvedType("TsArray", [type]);
            this.nodeManager.addNode(type, startPos);
        }

        return type;
    }

    parseExpression() {
        return this.expressionParser.parse();
    }

    parseExpressionToken(): Expression {
        if (this.reader.readToken("null")) {
            return new NullLiteral();
        } else if (this.reader.readToken("true")) {
            return new BooleanLiteral(true);
        } else if (this.reader.readToken("false")) {
            return new BooleanLiteral(false);
        } else if (this.reader.readToken("`")) {
            const parts: TemplateStringPart[] = [];
            while (true) {
                const litMatch = this.reader.readRegex("([^$`]|\\$[^{]|\\\\${|\\\\`)*");
                parts.push(TemplateStringPart.Literal(litMatch[0]));
                if (this.reader.readToken("`"))
                    break;
                else {
                    this.reader.expectToken("${");
                    const expr = this.parseExpression();
                    parts.push(TemplateStringPart.Expression(expr));
                    this.reader.expectToken("}");
                }
            }
            return new TemplateString(parts);
        } else if (this.reader.readToken("new")) {
            const type = this.parseType();
            this.reader.expectToken("(");
            const args = this.expressionParser.parseCallArguments();
            return new NewExpression(type, args);
        } else if (this.reader.readToken("<")) {
            const newType = this.parseType();
            this.reader.expectToken(">");
            const expression = this.parseExpression();
            return new CastExpression(newType, expression);
        }

        const mapLiteral = this.expressionParser.parseMapLiteral();
        if (mapLiteral != null) return mapLiteral;

        const arrayLiteral = this.expressionParser.parseArrayLiteral();
        if (arrayLiteral != null) return arrayLiteral;

        return null;
    }

    parseTypeAndInit() {
        const type = this.reader.readToken(":") ? this.parseType() : null;
        const init = this.reader.readToken("=") ? this.parseExpression() : null;

        if (type === null && init === null)
            this.reader.fail(`expected type declaration or initializer`);

        return { type, init };
    }

    parseBlockOrStatement() {
        const block = this.parseBlock();
        if (block !== null) return block;

        const stmt = this.parseStatement();
        if (stmt === null)
            this.reader.fail("expected block or statement");

        return <Block> { statements: [stmt] };
    }

    parseStatement() {
        let statement: Statement = null;

        const leadingTrivia = this.reader.readLeadingTrivia();
        const startPos = this.reader.offset;

        let requiresClosing = true;
        const varDeclMatches = this.reader.readRegex("(const|let|var)\\b");
        if (varDeclMatches !== null) {
            const name = this.reader.expectIdentifier("expected variable name");
            const { type, init } = this.parseTypeAndInit();
            statement = new VariableDeclaration(name, type, init);
        } else if (this.reader.readToken("delete")) {
            statement = new UnsetStatement(this.parseExpression());
        } else if (this.reader.readToken("if")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const condition = this.parseExpression();
            this.reader.expectToken(")");
            const then = this.parseBlockOrStatement();
            const else_ = this.reader.readToken("else") ? this.parseBlockOrStatement() : null;
            statement = new IfStatement(condition, then, else_);
        } else if (this.reader.readToken("while")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const condition = this.parseExpression();
            this.reader.expectToken(")");
            const body = this.parseBlockOrStatement();
            statement = new WhileStatement(condition, body);
        } else if (this.reader.readToken("for")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const varDeclMod = this.reader.readAnyOf(["const", "let", "var"]);
            const itemVarName = this.reader.expectIdentifier();
            if (this.reader.readToken("of")) {
                const items = this.parseExpression();
                this.reader.expectToken(")");
                const body = this.parseBlockOrStatement();
                statement = new ForeachStatement(new ForeachVariable(itemVarName), items, body);
            } else {
                const { type, init } = this.parseTypeAndInit();
                this.reader.expectToken(";");
                const condition = this.parseExpression();
                this.reader.expectToken(";");
                const incrementor = this.parseExpression();
                this.reader.expectToken(")");
                const body = this.parseBlockOrStatement();
                statement = new ForStatement(new ForVariable(name, type, init), condition, incrementor, body);
            }
        } else if (this.reader.readToken("return")) {
            const expr = this.reader.peekToken(";") ? null : this.parseExpression();
            statement = new ReturnStatement(expr);
        } else if (this.reader.readToken("throw")) {
            const expr = this.parseExpression();
            statement = new ThrowStatement(expr);
        } else if (this.reader.readToken("break")) {
            statement = new BreakStatement();
        } else {
            const expr = this.parseExpression();
            statement = new ExpressionStatement(expr);
            if (!(expr instanceof CallExpression ||
                (expr instanceof BinaryExpression && ["=", "+=", "-="].includes(expr.operator)) ||
                (expr instanceof UnaryExpression && ["++", "--"].includes(expr.operator))))
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

        const block = <Block> { statements: [] };
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
        return new ExpressionStatement(expr);
    }

    parseMethodSignature(isConstructor: boolean, declarationOnly: boolean) {
        const bodyPrefixStatements: Statement[] = [];
        const params: MethodParameter[] = [];
        const fields: Field[] = [];
        if (!this.reader.readToken(")")) {
            do {
                this.reader.skipWhitespace();
                const paramStart = this.reader.offset;
                const isPublic = this.reader.readToken("public");
                if (isPublic && !isConstructor)
                    this.reader.fail("public modifier is only allowed in constructor definition");

                const paramName = this.reader.expectIdentifier();
                this.context.push(`arg:${paramName}`);
                const { type, init } = this.parseTypeAndInit();
                const param = new MethodParameter(paramName, type, init);
                params.push(param);

                if (isPublic) {
                    fields.push(new Field(paramName, type, init, Visibility.Public, false, null));
                    bodyPrefixStatements.push(this.parseExprStmtFromString(`this.${paramName} = ${paramName}`));
                }

                this.nodeManager.addNode(param, paramStart);
                this.context.pop();
            } while (this.reader.readToken(","));

            this.reader.expectToken(")");
        }

        const returns = !isConstructor && this.reader.readToken(":") ? this.parseType() : new AnyType();

        let body: Block = null;
        if (declarationOnly) {
            this.reader.expectToken(";");
        } else {
            body = this.parseBlock();
            if (body === null)
                this.reader.fail("method body is missing");
            body.statements = [...bodyPrefixStatements, ...body.statements];
        }

        return { params, fields, body, returns };
    }

    parseInterface(leadingTrivia: string) {
        if (!this.reader.readToken("interface")) return null;
        const intfStart = this.reader.prevTokenOffset;

        const intfName = this.reader.expectIdentifier("expected identifier after 'interface' keyword");
        this.context.push(`I:${intfName}`);

        const intfTypeArgs = this.parseTypeArguments();

        const baseInterfaces: Type[] = [];
        if (this.reader.readToken("extends")) {
            do {
                baseInterfaces.push(new UnresolvedType(this.reader.expectIdentifier()));
            } while (this.reader.readToken(","))
        }

        const methods: { [name: string]: Method } = {};

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const memberName = this.reader.expectIdentifier();
            const methodTypeArgs = this.parseTypeArguments();
            this.reader.expectToken("("); // method

            this.context.push(`M:${memberName}`);
            const { params, body, returns } = this.parseMethodSignature(/* isConstructor = */ false, /* declarationOnly = */ true);
            this.context.pop();

            const method = new Method(memberName, methodTypeArgs, params, body, Visibility.Public, false, returns, leadingTrivia);
            methods[method.name] = method;
            this.nodeManager.addNode(method, memberStart);
        }

        const intf = new Interface(intfName, intfTypeArgs, baseInterfaces, methods, leadingTrivia);
        this.nodeManager.addNode(intf, intfStart);
        this.context.pop();
        return intf;
    }

    parseClass(leadingTrivia: string) {
        const clsModifiers = this.reader.readModifiers(["declare"]);
        const declarationOnly = clsModifiers.includes("declare");
        if (!this.reader.readToken("class")) return null;
        const clsStart = this.reader.prevTokenOffset;
        
        const name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${name}`);

        const typeArgs = this.parseTypeArguments();
        const baseClass = this.reader.readToken("extends") ? new UnresolvedType(this.reader.readIdentifier()) : null;

        const baseInterfaces: Type[] = [];
        if (this.reader.readToken("implements")) {
            do {
                baseInterfaces.push(new UnresolvedType(this.reader.expectIdentifier()));
            } while (this.reader.readToken(","))
        }

        let constructor: Constructor = null;
        const fields: { [name: string]: Field } = {};
        const methods: { [name: string]: Method } = {};
        const properties: { [name: string]: Property } = {};

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const memberLeadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? Visibility.Private :
                modifiers.includes("protected") ? Visibility.Protected : Visibility.Public;

            const memberName = this.reader.expectIdentifier();
            const methodTypeArgs = this.parseTypeArguments();
            if (this.reader.readToken("(")) { // method
                const isConstructor = memberName === "constructor";

                let member: IMethodBase;
                const { params, fields: constrFields, body, returns } = this.parseMethodSignature(isConstructor, declarationOnly);
                if (isConstructor) {
                    member = constructor = new Constructor(params, body, memberLeadingTrivia);
                    for (const field of constrFields)
                        fields[field.name] = field;
                } else {
                    const method = new Method(memberName, methodTypeArgs, params, body, visibility, isStatic, returns, memberLeadingTrivia);
                    member = methods[method.name] = method;
                }

                this.nodeManager.addNode(member, memberStart);
            } else if (memberName === "get" || memberName === "set") { // property
                const propName = this.reader.expectIdentifier();
                let prop = properties[propName];
                let propType: Type = null;
                let getter: Block = null;
                let setter: Block = null;

                if (memberName === "get") { // get propName(): propType { return ... }
                    this.context.push(`P[G]:${propName}`);
                    this.reader.expectToken("()", "expected '()' after property getter name");
                    propType = this.reader.readToken(":") ? this.parseType() : null;
                    getter = this.parseBlock();
                    if (!getter)
                        this.reader.fail("property getter body is missing");
                    if (prop)
                        prop.getter = getter;
                } else if (memberName === "set") { // set propName(value: propType) { ... }
                    this.context.push(`P[S]:${propName}`);
                    this.reader.expectToken("(", "expected '(' after property setter name");
                    this.reader.expectIdentifier();
                    propType = this.reader.readToken(":") ? this.parseType() : null;
                    this.reader.expectToken(")");
                    setter = this.parseBlock();
                    if (!setter)
                        this.reader.fail("property setter body is missing");
                    if (prop)
                        prop.setter = setter;
                }

                if (prop === null) {
                    prop = new Property(propName, propType, getter, setter, visibility, isStatic, memberLeadingTrivia);
                    properties[prop.name] = prop;
                    this.nodeManager.addNode(prop, memberStart);
                }

                this.context.pop();
            } else {
                this.context.push(`F:${memberName}`);

                const { type, init } = this.parseTypeAndInit();
                this.reader.expectToken(";");

                const field = new Field(memberName, type, init, visibility, isStatic, memberLeadingTrivia);
                fields[field.name] = field;

                this.nodeManager.addNode(field, memberStart);
                this.context.pop();
            }
        }

        const cls = new Class(name, typeArgs, baseClass, baseInterfaces, fields, properties, constructor, methods, leadingTrivia);
        this.nodeManager.addNode(cls, clsStart);
        this.context.pop();
        return cls;
    }

    parseEnum(leadingTrivia: string) {
        if (!this.reader.readToken("enum")) return null;
        const enumStart = this.reader.prevTokenOffset;

        const name = this.reader.expectIdentifier("expected identifier after 'enum' keyword");
        this.context.push(`E:${name}`);

        const members: EnumMember[] = [];

        this.reader.expectToken("{");
        if (!this.reader.readToken("}")) {
            do {
                if (this.reader.peekToken("}")) break; // eg. "enum { A, B, }" (but multiline)

                const enumMember = new EnumMember(this.reader.expectIdentifier());
                members.push(enumMember);
                this.nodeManager.addNode(enumMember, this.reader.prevTokenOffset);

                // TODO: generated code compatibility
                this.reader.readToken(`= "${enumMember.name}"`);
            } while(this.reader.readToken(","));
            this.reader.expectToken("}");
        }

        const enumObj = new Enum(name, members, leadingTrivia);
        this.nodeManager.addNode(enumObj, enumStart);
        this.context.pop();
        return enumObj;
    }

    parseImport() {
        if (!this.reader.readToken("import")) return null;
        const importStart = this.reader.prevTokenOffset;

        const names: string[] = [];

        this.reader.expectToken("{");
        do {
            if (this.reader.peekToken("}")) break;

            const imp = this.reader.expectIdentifier();
            names.push(imp);
            this.nodeManager.addNode(imp, this.reader.prevTokenOffset);
        } while(this.reader.readToken(","));
        this.reader.expectToken("}");

        this.reader.expectToken("from");
        const packageName = this.reader.expectString();
        this.reader.expectToken(";");

        const imports = names.map(name => new Import(packageName, name, null));
        //this.nodeManager.addNode(imports, importStart);
        return imports;
    }

    parseSourceFile() {
        const imports: Import[] = [];
        const enums: { [name: string]: Enum } = {};
        const intfs: { [name: string]: Interface } = {};
        const classes: { [name: string]: Class } = {};
        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const imps = this.parseImport();
            if (imps !== null) {
                imps[0].leadingTrivia = leadingTrivia;
                imports.push(...imps);
                continue;
            }

            const modifiers = this.reader.readModifiers(["export"]);

            const cls = this.parseClass(leadingTrivia);
            if (cls !== null) {
                classes[cls.name] = cls;
                continue;
            }

            const enumObj = this.parseEnum(leadingTrivia);
            if (enumObj !== null) {
                enums[enumObj.name] = enumObj;
                continue;
            }

            const intf = this.parseInterface(leadingTrivia);
            if (intf !== null) {
                intfs[intf.name] = intf;
                continue;
            }

            break;
        }

        this.reader.skipWhitespace();

        const stmts: Statement[] = [];
        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const stmt = this.parseStatement();
            if (stmt === null)
                this.reader.fail("expected a statement here");

            stmt.leadingTrivia = leadingTrivia;
            stmts.push(stmt);
        }
        
        return new SourceFile(imports, intfs, classes, enums, new Block(stmts));
    }

    parse() {
        return this.parseSourceFile();
    }

    static parseFile(source: string) {
        return new TypeScriptParser2(source).parse();
    }
}