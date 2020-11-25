import { Reader, IReaderHooks, ParseError } from "./Common/Reader";
import { ExpressionParser, IExpressionParserHooks } from "./Common/ExpressionParser";
import { NodeManager } from "./Common/NodeManager";
import { IParser } from "./Common/IParser";
import { AnyType, VoidType, UnresolvedType, LambdaType } from "../One/Ast/AstTypes";
import { Expression, TemplateString, TemplateStringPart, NewExpression, Identifier, CastExpression, NullLiteral, BooleanLiteral, BinaryExpression, UnaryExpression, UnresolvedCallExpression, PropertyAccessExpression, InstanceOfExpression, RegexLiteral, AwaitExpression, ParenthesizedExpression, UnresolvedNewExpression } from "../One/Ast/Expressions";
import { VariableDeclaration, Statement, UnsetStatement, IfStatement, WhileStatement, ForeachStatement, ForStatement, ReturnStatement, ThrowStatement, BreakStatement, ExpressionStatement, ForeachVariable, ForVariable, DoStatement, ContinueStatement, TryStatement, CatchVariable, Block } from "../One/Ast/Statements";
import { Class, Method, MethodParameter, Field, Visibility, SourceFile, Property, Constructor, Interface, EnumMember, Enum, IMethodBase, Import, SourcePath, ExportScopeRef, Package, Lambda, UnresolvedImport, GlobalFunction } from "../One/Ast/Types";
import { IType } from "../One/Ast/Interfaces";

class TypeAndInit {
    constructor(
        public type: IType,
        public init: Expression) { }
}

class MethodSignature {
    constructor(
        public params: MethodParameter[],
        public fields: Field[],
        public body: Block,
        public returns: IType,
        public superCallArgs: Expression[]) { }
}

export class TypeScriptParser2 implements IParser, IExpressionParserHooks, IReaderHooks {
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;
    nodeManager: NodeManager;
    exportScope: ExportScopeRef;
    missingReturnTypeIsVoid = false;
    allowDollarIds = false; // TODO: hack to support templates

    constructor(source: string, public path: SourcePath = null) {
        this.reader = new Reader(source);
        this.reader.hooks = this;
        this.nodeManager = new NodeManager(this.reader);
        this.expressionParser = this.createExpressionParser(this.reader, this.nodeManager);
        this.exportScope = this.path !== null ? new ExportScopeRef(this.path.pkg.name, this.path.path !== null ? this.path.path.replace(/\.ts$/, "") : null) : null;
    }

    createExpressionParser(reader: Reader, nodeManager: NodeManager = null): ExpressionParser {
        const expressionParser = new ExpressionParser(reader, this, nodeManager);
        expressionParser.stringLiteralType = new UnresolvedType("TsString", []);
        expressionParser.numericLiteralType = new UnresolvedType("TsNumber", []);
        return expressionParser;
    }

    errorCallback(error: ParseError): void {
        throw new Error(`[TypeScriptParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview(error.cursor)}`);
    }

    infixPrehook(left: Expression): Expression {
        if (left instanceof PropertyAccessExpression && this.reader.peekRegex("<[A-Za-z0-9_<>]*?>\\(") !== null) {
            const typeArgs = this.parseTypeArgs();
            this.reader.expectToken("(");
            const args = this.expressionParser.parseCallArguments();
            return new UnresolvedCallExpression(left, typeArgs, args);
        } else if (this.reader.readToken("instanceof")) {
            const type = this.parseType();
            return new InstanceOfExpression(left, type);
        } else if (left instanceof Identifier && this.reader.readToken("=>")) {
            const block = this.parseLambdaBlock();
            return new Lambda([new MethodParameter(left.text, null, null, null)], block);
        }
        return null;
    }

    parseLambdaParams(): MethodParameter[] {
        if (!this.reader.readToken("(")) return null;

        const params: MethodParameter[] = [];
        if (!this.reader.readToken(")")) {
            do {
                const paramName = this.reader.expectIdentifier();
                const type = this.reader.readToken(":") ? this.parseType() : null;
                params.push(new MethodParameter(paramName, type, null, null));
            } while (this.reader.readToken(","));
            this.reader.expectToken(")");
        }
        return params;
    }

    parseType(): IType {
        if (this.reader.readToken("{")) {
            this.reader.expectToken("[");
            this.reader.readIdentifier();
            this.reader.expectToken(":");
            this.reader.expectToken("string");
            this.reader.expectToken("]");
            this.reader.expectToken(":");
            const mapValueType = this.parseType();
            this.reader.readToken(";");
            this.reader.expectToken("}");
            return new UnresolvedType("TsMap", [mapValueType]);
        }

        if (this.reader.peekToken("(")) {
            const params = this.parseLambdaParams();
            this.reader.expectToken("=>");
            const returnType = this.parseType();
            return new LambdaType(params, returnType);
        }

        const typeName = this.reader.expectIdentifier();
        const startPos = this.reader.prevTokenOffset;

        let type: IType;
        if (typeName === "string") {
            type = new UnresolvedType("TsString", []);
        } else if (typeName === "boolean") {
            type = new UnresolvedType("TsBoolean", []);
        } else if (typeName === "number") {
            type = new UnresolvedType("TsNumber", []);
        } else if (typeName === "any") {
            type = AnyType.instance;
        } else if (typeName === "void") {
            type = VoidType.instance;
        } else {
            const typeArguments = this.parseTypeArgs();
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

    unaryPrehook(): Expression {
        if (this.reader.readToken("null")) {
            return new NullLiteral();
        } else if (this.reader.readToken("true")) {
            return new BooleanLiteral(true);
        } else if (this.reader.readToken("false")) {
            return new BooleanLiteral(false);
        } else if (this.reader.readToken("`")) {
            const parts: TemplateStringPart[] = [];
            let litPart = "";
            while (true) {
                if (this.reader.readExactly("`")) {
                    if (litPart !== "") {
                        parts.push(TemplateStringPart.Literal(litPart));
                        litPart = "";
                    }

                    break;
                } else if (this.reader.readExactly("${")) {
                    if (litPart !== "") {
                        parts.push(TemplateStringPart.Literal(litPart));
                        litPart = "";
                    }

                    const expr = this.parseExpression();
                    parts.push(TemplateStringPart.Expression(expr));
                    this.reader.expectToken("}");
                } else if (this.allowDollarIds && this.reader.readExactly("$")) {
                    if (litPart !== "") {
                        parts.push(TemplateStringPart.Literal(litPart));
                        litPart = "";
                    }

                    const id = this.reader.readIdentifier();
                    parts.push(TemplateStringPart.Expression(new Identifier(id)));
                } else if (this.reader.readExactly("\\")) {
                    const chr = this.reader.readChar();
                    if (chr === "n")      litPart += "\n";
                    else if (chr === "r") litPart += "\r";
                    else if (chr === "t") litPart += "\t";
                    else if (chr === "`") litPart += "`";
                    else if (chr === "$") litPart += "$";
                    else if (chr === "\\") litPart += "\\";
                    else
                        this.reader.fail("invalid escape", this.reader.offset - 1);
                } else {
                    const chr = this.reader.readChar();
                    const chrCode = chr.charCodeAt(0);
                    if (!(32 <= chrCode && chrCode <= 126) || chr === "`" || chr === "\\")
                        this.reader.fail(`not allowed character (code=${chrCode})`, this.reader.offset - 1);
                    litPart += chr;
                }
            }
            return new TemplateString(parts);
        } else if (this.reader.readToken("new")) {
            const type = this.parseType();
            if (type instanceof UnresolvedType) {
                this.reader.expectToken("(");
                const args = this.expressionParser.parseCallArguments();
                return new UnresolvedNewExpression(type, args);
            } else
                throw new Error(`[TypeScriptParser2] Expected UnresolvedType here!`);
        } else if (this.reader.readToken("<")) {
            const newType = this.parseType();
            this.reader.expectToken(">");
            const expression = this.parseExpression();
            return new CastExpression(newType, expression);
        } else if (this.reader.readToken("/")) {
            let pattern = "";
            while (true) {
                const chr = this.reader.readChar();
                if (chr === "\\") {
                    const chr2 = this.reader.readChar();
                    pattern += chr2 === "/" ? "/" : "\\" + chr2;
                } else if (chr === "/") {
                    break;
                } else
                    pattern += chr;
            }
            const modifiers = this.reader.readModifiers(["g", "i"]);
            return new RegexLiteral(pattern, modifiers.includes("i"), modifiers.includes("g"));
        } else if (this.reader.readToken("typeof")) {
            const expr = this.expressionParser.parse(this.expressionParser.prefixPrecedence);
            this.reader.expectToken("===");
            const check = this.reader.expectString();
            
            let tsType: string = null;
            if (check === "string")
                tsType = "TsString";
            else if (check === "boolean")
                tsType = "TsBoolean";
            else if (check === "object")
                tsType = "Object";
            else if (check === "function") // TODO: ???
                tsType = "Function";
            else if (check === "undefined") // TODO: ???
                tsType = "Object"; // ignore for now
            else
                this.reader.fail("unexpected typeof comparison");

            return new InstanceOfExpression(expr, new UnresolvedType(tsType, []));
        } else if (this.reader.peekRegex("\\([A-Za-z0-9_]+\\s*[:,]|\\(\\)") !== null) {
            const params = this.parseLambdaParams();
            this.reader.expectToken("=>");
            const block = this.parseLambdaBlock();
            return new Lambda(params, block);
        } else if (this.reader.readToken("await")) {
            const expression = this.parseExpression();
            return new AwaitExpression(expression);
        }

        const mapLiteral = this.expressionParser.parseMapLiteral();
        if (mapLiteral != null) return mapLiteral;

        const arrayLiteral = this.expressionParser.parseArrayLiteral();
        if (arrayLiteral != null) return arrayLiteral;

        return null;
    }

    parseLambdaBlock(): Block {
        const block = this.parseBlock();
        if (block !== null) return block;
        
        let returnExpr = this.parseExpression();
        if (returnExpr instanceof ParenthesizedExpression)
            returnExpr = returnExpr.expression;
        return new Block([new ReturnStatement(returnExpr)]);
    }

    parseTypeAndInit(): TypeAndInit {
        const type = this.reader.readToken(":") ? this.parseType() : null;
        const init = this.reader.readToken("=") ? this.parseExpression() : null;

        if (type === null && init === null)
            this.reader.fail(`expected type declaration or initializer`);

        return new TypeAndInit(type, init);
    }

    expectBlockOrStatement(): Block {
        const block = this.parseBlock();
        if (block !== null) return block;

        const stmts: Statement[] = [];
        const stmt = this.expectStatement();
        if (stmt !== null)
            stmts.push(stmt);
        return new Block(stmts);
    }

    expectStatement(): Statement {
        let statement: Statement = null;

        const leadingTrivia = this.reader.readLeadingTrivia();
        const startPos = this.reader.offset;

        let requiresClosing = true;
        const varDeclMatches = this.reader.readRegex("(const|let|var)\\b");
        if (varDeclMatches !== null) {
            const name = this.reader.expectIdentifier("expected variable name");
            const typeAndInit = this.parseTypeAndInit();
            statement = new VariableDeclaration(name, typeAndInit.type, typeAndInit.init);
        } else if (this.reader.readToken("delete")) {
            statement = new UnsetStatement(this.parseExpression());
        } else if (this.reader.readToken("if")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const condition = this.parseExpression();
            this.reader.expectToken(")");
            const then = this.expectBlockOrStatement();
            const else_ = this.reader.readToken("else") ? this.expectBlockOrStatement() : null;
            statement = new IfStatement(condition, then, else_);
        } else if (this.reader.readToken("while")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const condition = this.parseExpression();
            this.reader.expectToken(")");
            const body = this.expectBlockOrStatement();
            statement = new WhileStatement(condition, body);
        } else if (this.reader.readToken("do")) {
            requiresClosing = false;
            const body = this.expectBlockOrStatement();
            this.reader.expectToken("while");
            this.reader.expectToken("(");
            const condition = this.parseExpression();
            this.reader.expectToken(")");
            statement = new DoStatement(condition, body);
        } else if (this.reader.readToken("for")) {
            requiresClosing = false;
            this.reader.expectToken("(");
            const varDeclMod = this.reader.readAnyOf(["const", "let", "var"]);
            const itemVarName = varDeclMod === null ? null : this.reader.expectIdentifier();
            if (itemVarName !== null && this.reader.readToken("of")) {
                const items = this.parseExpression();
                this.reader.expectToken(")");
                const body = this.expectBlockOrStatement();
                statement = new ForeachStatement(new ForeachVariable(itemVarName), items, body);
            } else {
                let forVar: ForVariable = null;
                if (itemVarName !== null) {
                    const typeAndInit = this.parseTypeAndInit();
                    forVar = new ForVariable(itemVarName, typeAndInit.type, typeAndInit.init);
                }
                this.reader.expectToken(";");
                const condition = this.parseExpression();
                this.reader.expectToken(";");
                const incrementor = this.parseExpression();
                this.reader.expectToken(")");
                const body = this.expectBlockOrStatement();
                statement = new ForStatement(forVar, condition, incrementor, body);
            }
        } else if (this.reader.readToken("try")) {
            const block = this.expectBlock("try body is missing");
            
            let catchVar: CatchVariable = null;
            let catchBody: Block = null;
            if (this.reader.readToken("catch")) {
                this.reader.expectToken("(");
                catchVar = new CatchVariable(this.reader.expectIdentifier(), null);
                this.reader.expectToken(")");
                catchBody = this.expectBlock("catch body is missing");
            }

            const finallyBody = this.reader.readToken("finally") ? this.expectBlock() : null;
            return new TryStatement(block, catchVar, catchBody, finallyBody);
        } else if (this.reader.readToken("return")) {
            const expr = this.reader.peekToken(";") ? null : this.parseExpression();
            statement = new ReturnStatement(expr);
        } else if (this.reader.readToken("throw")) {
            const expr = this.parseExpression();
            statement = new ThrowStatement(expr);
        } else if (this.reader.readToken("break")) {
            statement = new BreakStatement();
        } else if (this.reader.readToken("continue")) {
            statement = new ContinueStatement();
        } else if (this.reader.readToken("debugger;")) {
            return null;
        } else {
            const expr = this.parseExpression();
            statement = new ExpressionStatement(expr);
            const isBinarySet = expr instanceof BinaryExpression && ["=", "+=", "-="].includes(expr.operator);
            const isUnarySet = expr instanceof UnaryExpression && ["++", "--"].includes(expr.operator);
            if (!(expr instanceof UnresolvedCallExpression || isBinarySet || isUnarySet || expr instanceof AwaitExpression))
                this.reader.fail("this expression is not allowed as statement");
        }

        if (statement === null)
            this.reader.fail("unknown statement");

        statement.leadingTrivia = leadingTrivia;
        this.nodeManager.addNode(statement, startPos);

        const statementLastLine = this.reader.wsLineCounter;
        if (!this.reader.readToken(";") && requiresClosing && this.reader.wsLineCounter === statementLastLine)
            this.reader.fail("statement is not closed", this.reader.wsOffset);

        return statement;
    }

    parseBlock(): Block {
        if (!this.reader.readToken("{")) return null;
        const startPos = this.reader.prevTokenOffset;

        const statements: Statement[] = [];
        if (!this.reader.readToken("}")) {
            do {
                const statement = this.expectStatement();
                if (statement !== null)
                    statements.push(statement);
            } while(!this.reader.readToken("}"));
        }

        const block = new Block(statements);
        this.nodeManager.addNode(block, startPos);
        return block;
    }

    expectBlock(errorMsg: string = null): Block {
        const block = this.parseBlock();
        if (block === null)
            this.reader.fail(errorMsg || "expected block here");
        return block;
    }

    parseTypeArgs(): IType[] {
        const typeArguments: IType[] = [];
        if (this.reader.readToken("<")) {
            do {
                const generics = this.parseType();
                typeArguments.push(generics);
            } while(this.reader.readToken(","));
            this.reader.expectToken(">");
        }
        return typeArguments;
    }

    parseGenericsArgs(): string[] {
        const typeArguments: string[] = [];
        if (this.reader.readToken("<")) {
            do {
                const generics = this.reader.expectIdentifier();
                typeArguments.push(generics);
            } while(this.reader.readToken(","));
            this.reader.expectToken(">");
        }
        return typeArguments;
    }

    parseExprStmtFromString(expression: string): ExpressionStatement {
        const expr = this.createExpressionParser(new Reader(expression)).parse();
        return new ExpressionStatement(expr);
    }

    parseMethodSignature(isConstructor: boolean, declarationOnly: boolean): MethodSignature {
        const params: MethodParameter[] = [];
        const fields: Field[] = [];
        if (!this.reader.readToken(")")) {
            do {
                const leadingTrivia = this.reader.readLeadingTrivia();
                const paramStart = this.reader.offset;
                const isPublic = this.reader.readToken("public");
                if (isPublic && !isConstructor)
                    this.reader.fail("public modifier is only allowed in constructor definition");

                const paramName = this.reader.expectIdentifier();
                this.context.push(`arg:${paramName}`);
                const typeAndInit = this.parseTypeAndInit();
                const param = new MethodParameter(paramName, typeAndInit.type, typeAndInit.init, leadingTrivia);
                params.push(param);

                // init should be used as only the constructor's method parameter, but not again as a field initializer too
                //   (otherwise it would called twice if cloned or cause AST error is just referenced from two separate places)
                if (isPublic) {
                    const field = new Field(paramName, typeAndInit.type, null, Visibility.Public, false, param, param.leadingTrivia);
                    fields.push(field);
                    param.fieldDecl = field;
                }

                this.nodeManager.addNode(param, paramStart);
                this.context.pop();
            } while (this.reader.readToken(","));

            this.reader.expectToken(")");
        }

        let returns: IType = null;
        if (!isConstructor) // in case of constructor, "returns" won't be used
            returns = this.reader.readToken(":") ? this.parseType() : this.missingReturnTypeIsVoid ? VoidType.instance : null;

        let body: Block = null;
        let superCallArgs: Expression[] = null;
        if (declarationOnly) {
            this.reader.expectToken(";");
        } else {
            body = this.expectBlock("method body is missing");
            const firstStmt = body.statements.length > 0 ? body.statements[0] : null;
            if (firstStmt instanceof ExpressionStatement && firstStmt.expression instanceof UnresolvedCallExpression && 
                firstStmt.expression.func instanceof Identifier && firstStmt.expression.func.text === "super") {
                    superCallArgs = firstStmt.expression.args;
                    body.statements.shift();
                }
        }

        return new MethodSignature(params, fields, body, returns, superCallArgs);
    }

    parseIdentifierOrString() {
        return this.reader.readString() || this.reader.expectIdentifier();
    }

    parseInterface(leadingTrivia: string, isExported: boolean) {
        if (!this.reader.readToken("interface")) return null;
        const intfStart = this.reader.prevTokenOffset;

        const intfName = this.reader.expectIdentifier("expected identifier after 'interface' keyword");
        this.context.push(`I:${intfName}`);

        const intfTypeArgs = this.parseGenericsArgs();

        const baseInterfaces: IType[] = [];
        if (this.reader.readToken("extends")) {
            do {
                baseInterfaces.push(this.parseType());
            } while (this.reader.readToken(","))
        }

        const methods: Method[] = [];
        const fields: Field[] = [];

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const memberLeadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const memberName = this.parseIdentifierOrString();
            if (this.reader.readToken(":")) {
                this.context.push(`F:${memberName}`);

                const fieldType = this.parseType();
                this.reader.expectToken(";");

                const field = new Field(memberName, fieldType, null, Visibility.Public, false, null, memberLeadingTrivia);
                fields.push(field);

                this.nodeManager.addNode(field, memberStart);
                this.context.pop();
            } else {
                this.context.push(`M:${memberName}`);
                const methodTypeArgs = this.parseGenericsArgs();
                this.reader.expectToken("("); // method
    
                const sig = this.parseMethodSignature(/* isConstructor = */ false, /* declarationOnly = */ true);
    
                const method = new Method(memberName, methodTypeArgs, sig.params, sig.body, Visibility.Public, false, sig.returns, false, memberLeadingTrivia);
                methods.push(method);
                this.nodeManager.addNode(method, memberStart);
                this.context.pop();
            }
        }

        const intf = new Interface(intfName, intfTypeArgs, baseInterfaces, fields, methods, isExported, leadingTrivia);
        this.nodeManager.addNode(intf, intfStart);
        this.context.pop();
        return intf;
    }

    parseSpecifiedType() {
        const typeName = this.reader.readIdentifier();
        const typeArgs = this.parseTypeArgs();
        return new UnresolvedType(typeName, typeArgs);
    }

    parseClass(leadingTrivia: string, isExported: boolean, declarationOnly: boolean) {
        const clsModifiers = this.reader.readModifiers(["abstract"]);
        if (!this.reader.readToken("class")) return null;
        const clsStart = this.reader.prevTokenOffset;
        
        const clsName = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${clsName}`);

        const typeArgs = this.parseGenericsArgs();
        const baseClass = this.reader.readToken("extends") ? this.parseSpecifiedType() : null;

        const baseInterfaces: IType[] = [];
        if (this.reader.readToken("implements")) {
            do {
                baseInterfaces.push(this.parseSpecifiedType());
            } while (this.reader.readToken(","))
        }

        let constructor: Constructor = null;
        const fields: Field[] = [];
        const methods: Method[] = [];
        const properties: Property[] = [];

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const memberLeadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private", "readonly", "async", "abstract"]);
            const isStatic = modifiers.includes("static");
            const isAsync = modifiers.includes("async");
            const isAbstract = modifiers.includes("abstract");
            const visibility = modifiers.includes("private") ? Visibility.Private :
                modifiers.includes("protected") ? Visibility.Protected : Visibility.Public;

            const memberName = this.parseIdentifierOrString();
            const methodTypeArgs = this.parseGenericsArgs();
            if (this.reader.readToken("(")) { // method
                const isConstructor = memberName === "constructor";

                let member: IMethodBase;
                const sig = this.parseMethodSignature(isConstructor, declarationOnly || isAbstract);
                if (isConstructor) {
                    member = constructor = new Constructor(sig.params, sig.body, sig.superCallArgs, memberLeadingTrivia);
                    for (const field of sig.fields)
                        fields.push(field);
                } else {
                    const method = new Method(memberName, methodTypeArgs, sig.params, sig.body, visibility, isStatic, sig.returns, isAsync, memberLeadingTrivia);
                    methods.push(method);
                    member = method;
                }

                this.nodeManager.addNode(member, memberStart);
            } else if (memberName === "get" || memberName === "set") { // property
                const propName = this.reader.expectIdentifier();
                let prop = properties.find(x => x.name === propName) || null;
                let propType: IType = null;
                let getter: Block = null;
                let setter: Block = null;

                if (memberName === "get") { // get propName(): propType { return ... }
                    this.context.push(`P[G]:${propName}`);
                    this.reader.expectToken("()", "expected '()' after property getter name");
                    propType = this.reader.readToken(":") ? this.parseType() : null;
                    if (declarationOnly) {
                        if (propType === null)
                            this.reader.fail("Type is missing for property in declare class");
                        this.reader.expectToken(";");
                    } else {
                        getter = this.expectBlock("property getter body is missing");
                        if (prop !== null)
                            prop.getter = getter;
                    }
                } else if (memberName === "set") { // set propName(value: propType) { ... }
                    this.context.push(`P[S]:${propName}`);
                    this.reader.expectToken("(", "expected '(' after property setter name");
                    this.reader.expectIdentifier();
                    propType = this.reader.readToken(":") ? this.parseType() : null;
                    this.reader.expectToken(")");
                    if (declarationOnly) {
                        if (propType === null)
                            this.reader.fail("Type is missing for property in declare class");
                        this.reader.expectToken(";");
                    } else {
                        setter = this.expectBlock("property setter body is missing");
                        if (prop !== null)
                            prop.setter = setter;
                    }
                }

                if (!prop) {
                    prop = new Property(propName, propType, getter, setter, visibility, isStatic, memberLeadingTrivia);
                    properties.push(prop);
                    this.nodeManager.addNode(prop, memberStart);
                }

                this.context.pop();
            } else {
                this.context.push(`F:${memberName}`);

                const typeAndInit = this.parseTypeAndInit();
                this.reader.expectToken(";");

                const field = new Field(memberName, typeAndInit.type, typeAndInit.init, visibility, isStatic, null, memberLeadingTrivia);
                fields.push(field);

                this.nodeManager.addNode(field, memberStart);
                this.context.pop();
            }
        }

        const cls = new Class(clsName, typeArgs, baseClass, baseInterfaces, fields, properties, constructor, methods, isExported, leadingTrivia);
        this.nodeManager.addNode(cls, clsStart);
        this.context.pop();
        return cls;
    }

    parseEnum(leadingTrivia: string, isExported: boolean) {
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

        const enumObj = new Enum(name, members, isExported, leadingTrivia);
        this.nodeManager.addNode(enumObj, enumStart);
        this.context.pop();
        return enumObj;
    }

    static calculateRelativePath(currFile: string, relPath: string) {
        if (!relPath.startsWith("."))
            throw new Error(`relPath must start with '.', but got '${relPath}'`);

        const curr = currFile.split(/\//g);
        curr.pop(); // filename does not matter
        for (const part of relPath.split(/\//g)) {
            if (part === "") throw new Error(`relPath should not contain multiple '/' next to each other (relPath='${relPath}')`);
            if (part === ".") { // "./" == stay in current directory
                continue;
            } else if (part === "..") {  // "../" == parent directory
                if (curr.length === 0)
                    throw new Error(`relPath goes out of root (curr='${currFile}', relPath='${relPath}')`);
                curr.pop();
            } else
                curr.push(part);
        }
        return curr.join("/");
    }

    static calculateImportScope(currScope: ExportScopeRef, importFile: string) {
        if (importFile.startsWith(".")) // relative
            return new ExportScopeRef(currScope.packageName, this.calculateRelativePath(currScope.scopeName, importFile));
        else {
            const path = importFile.split(/\//g);
            const pkgName = path.shift();
            return new ExportScopeRef(pkgName, path.length === 0 ? Package.INDEX : path.join('/'));
        }
    }

    readIdentifier() {
        const rawId = this.reader.readIdentifier();
        return rawId.replace(/_+$/, "");
    }

    parseImport(leadingTrivia: string) {
        if (!this.reader.readToken("import")) return null;
        const importStart = this.reader.prevTokenOffset;

        let importAllAlias: string = null;
        let importParts: UnresolvedImport[] = [];

        if (this.reader.readToken("*")) {
            this.reader.expectToken("as");
            importAllAlias = this.reader.expectIdentifier();
        } else {
            this.reader.expectToken("{");
            do {
                if (this.reader.peekToken("}")) break;
    
                const imp = this.reader.expectIdentifier();
                if (this.reader.readToken("as"))
                    this.reader.fail("This is not yet supported");
                importParts.push(new UnresolvedImport(imp));
                this.nodeManager.addNode(imp, this.reader.prevTokenOffset);
            } while(this.reader.readToken(","));
            this.reader.expectToken("}");
        }

        this.reader.expectToken("from");
        const moduleName = this.reader.expectString();
        this.reader.expectToken(";");

        const importScope = this.exportScope !== null ? TypeScriptParser2.calculateImportScope(this.exportScope, moduleName) : null;
        
        const imports: Import[] = [];
        if (importParts.length > 0)
            imports.push(new Import(importScope, false, importParts, null, leadingTrivia));

        if (importAllAlias !== null)
            imports.push(new Import(importScope, true, null, importAllAlias, leadingTrivia));
        //this.nodeManager.addNode(imports, importStart);
        return imports;
    }

    parseSourceFile() {
        const imports: Import[] = [];
        const enums: Enum[] = [];
        const intfs: Interface[] = [];
        const classes: Class[] = [];
        const funcs: GlobalFunction[] = [];
        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const imps = this.parseImport(leadingTrivia);
            if (imps !== null) {
                for (const imp of imps)
                    imports.push(imp);
                continue;
            }

            const modifiers = this.reader.readModifiers(["export", "declare"]);
            const isExported = modifiers.includes("export");
            const isDeclaration = modifiers.includes("declare");

            const cls = this.parseClass(leadingTrivia, isExported, isDeclaration);
            if (cls !== null) {
                classes.push(cls);
                continue;
            }

            const enumObj = this.parseEnum(leadingTrivia, isExported);
            if (enumObj !== null) {
                enums.push(enumObj);
                continue;
            }

            const intf = this.parseInterface(leadingTrivia, isExported);
            if (intf !== null) {
                intfs.push(intf);
                continue;
            }

            if (this.reader.readToken("function")) {
                const funcName = this.readIdentifier();
                this.reader.expectToken("(");
                const sig = this.parseMethodSignature(false, isDeclaration);
                funcs.push(new GlobalFunction(funcName, sig.params, sig.body, sig.returns, isExported, leadingTrivia));
                continue;
            }

            break;
        }

        this.reader.skipWhitespace();

        const stmts: Statement[] = [];
        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const stmt = this.expectStatement();
            if (stmt === null) continue;

            stmt.leadingTrivia = leadingTrivia;
            stmts.push(stmt);
        }
        
        return new SourceFile(imports, intfs, classes, enums, funcs, new Block(stmts), this.path, this.exportScope);
    }

    parse() {
        return this.parseSourceFile();
    }

    static parseFile(source: string, path: SourcePath = null): SourceFile {
        return new TypeScriptParser2(source, path).parseSourceFile();
    }
}