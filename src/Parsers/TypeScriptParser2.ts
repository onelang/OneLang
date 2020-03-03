import { Reader } from "./Common/Reader";
import { ExpressionParser } from "./Common/ExpressionParser";
import { NodeManager } from "./Common/NodeManager";
import { IParser } from "./Common/IParser";
import { Type, AnyType, VoidType, UnresolvedType, LambdaType } from "../One/Ast/AstTypes";
import { Expression, TemplateString, TemplateStringPart, NewExpression, Identifier, CastExpression, NullLiteral, BooleanLiteral, BinaryExpression, UnaryExpression, UnresolvedCallExpression, PropertyAccessExpression, InstanceOfExpression, RegexLiteral, AwaitExpression, ParenthesizedExpression } from "../One/Ast/Expressions";
import { VariableDeclaration, Statement, UnsetStatement, IfStatement, WhileStatement, ForeachStatement, ForStatement, ReturnStatement, ThrowStatement, BreakStatement, ExpressionStatement, ForeachVariable, ForVariable, DoStatement, ContinueStatement } from "../One/Ast/Statements";
import { Block, Class, Method, MethodParameter, Field, Visibility, SourceFile, Property, Constructor, Interface, EnumMember, Enum, IMethodBase, Import, SourcePath, ExportScopeRef, Package, Lambda, UnresolvedImport, GlobalFunction } from "../One/Ast/Types";

class TypeAndInit {
    constructor(
        public type: Type,
        public init: Expression) { }
}

class MethodSignature {
    constructor(
        public params: MethodParameter[],
        public fields: Field[],
        public body: Block,
        public returns: Type) { }
}

export class TypeScriptParser2 implements IParser {
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;
    nodeManager: NodeManager;
    exportScope: ExportScopeRef;
    missingReturnTypeIsVoid = false;

    constructor(source: string, public path: SourcePath = null) {
        this.reader = new Reader(source);
        this.reader.errorCallback = error => {
            throw new Error(`[TypeScriptParser] ${error.message} at ${error.cursor.line}:${error.cursor.column} (context: ${this.context.join("/")})\n${this.reader.linePreview}`);
        };
        this.nodeManager = new NodeManager(this.reader);
        this.expressionParser = this.createExpressionParser(this.reader, this.nodeManager);
        this.exportScope = this.path ? new ExportScopeRef(this.path.pkg.name, this.path.path ? this.path.path.replace(/.ts$/, "") : null) : null;
    }

    createExpressionParser(reader: Reader, nodeManager: NodeManager = null) {
        const expressionParser = new ExpressionParser(reader, nodeManager);
        expressionParser.unaryPrehook = () => this.parseExpressionToken();
        expressionParser.infixPrehook = left => this.parseInfix(left);
        return expressionParser;
    }

    parseInfix(left: Expression) {
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
            return new Lambda([new MethodParameter(left.text, null, null)], block);
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
                params.push(new MethodParameter(paramName, type, null));
            } while (this.reader.readToken(","));
            this.reader.expectToken(")");
        }
        return params;
    }

    parseType(): Type {
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
            return new UnresolvedType("TsMap", [new UnresolvedType("TsString"), mapValueType]);
        }

        if (this.reader.peekToken("(")) {
            const params = this.parseLambdaParams();
            this.reader.expectToken("=>");
            const returnType = this.parseType();
            return new LambdaType(params, returnType);
        }

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
        } else if (this.reader.readToken("/")) {
            const pattern = this.reader.readRegex("((?<![\\\\])[\\\\]/|[^/])+")[0];
            this.reader.expectToken("/");
            const modifiers = this.reader.readModifiers(["g", "i"]);
            return new RegexLiteral(pattern, modifiers.includes("i"), modifiers.includes("g"));
        } else if (this.reader.readToken("typeof")) {
            const expr = this.expressionParser.parse(this.expressionParser.prefixPrecedence);
            this.reader.expectToken("===");
            const check = this.reader.expectString();
            
            let tsType = null;
            if (check === "string")
                tsType = "TsString";
            else if (check === "object")
                tsType = "Object";
            else if (check === "function") // TODO: ???
                tsType = "Function";
            else
                this.reader.fail("unexpected typeof comparison");

            return new InstanceOfExpression(expr, new UnresolvedType(tsType));
        } else if (this.reader.peekRegex("\\([A-Za-z0-9_]+\\s*[:,]|\\(\\)")) {
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

    parseLambdaBlock() {
        const block = this.parseBlock();
        if (block !== null) return block;
        
        let returnExpr = this.parseExpression();
        if (returnExpr instanceof ParenthesizedExpression)
            returnExpr = returnExpr.expression;
        return new Block([new ReturnStatement(returnExpr)]);
    }

    parseTypeAndInit() {
        const type = this.reader.readToken(":") ? this.parseType() : null;
        const init = this.reader.readToken("=") ? this.parseExpression() : null;

        if (type === null && init === null)
            this.reader.fail(`expected type declaration or initializer`);

        return new TypeAndInit(type, init);
    }

    parseBlockOrStatement() {
        const block = this.parseBlock();
        if (block !== null) return block;

        const stmt = this.parseStatement();
        if (stmt === null)
            this.reader.fail("expected block or statement");

        return new Block([stmt]);
    }

    parseStatement() {
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
        } else if (this.reader.readToken("do")) {
            requiresClosing = false;
            const body = this.parseBlockOrStatement();
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
                const body = this.parseBlockOrStatement();
                statement = new ForeachStatement(new ForeachVariable(itemVarName), items, body);
            } else {
                let forVar = null;
                if (itemVarName !== null) {
                    const typeAndInit = this.parseTypeAndInit();
                    forVar = new ForVariable(itemVarName, typeAndInit.type, typeAndInit.init);
                }
                this.reader.expectToken(";");
                const condition = this.parseExpression();
                this.reader.expectToken(";");
                const incrementor = this.parseExpression();
                this.reader.expectToken(")");
                const body = this.parseBlockOrStatement();
                statement = new ForStatement(forVar, condition, incrementor, body);
            }
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
        } else {
            const expr = this.parseExpression();
            statement = new ExpressionStatement(expr);
            if (!(expr instanceof UnresolvedCallExpression ||
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

        const statements: Statement[] = [];
        if (!this.reader.readToken("}")) {
            do {
                const statement = this.parseStatement();
                statements.push(statement);
            } while(!this.reader.readToken("}"));
        }

        const block = new Block(statements);
        this.nodeManager.addNode(block, startPos);
        return block;
    }

    parseTypeArgs(): Type[] {
        const typeArguments: Type[] = [];
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
                const typeAndInit = this.parseTypeAndInit();
                const param = new MethodParameter(paramName, typeAndInit.type, typeAndInit.init);
                params.push(param);

                if (isPublic) {
                    fields.push(new Field(paramName, typeAndInit.type, typeAndInit.init, Visibility.Public, false, null));
                    bodyPrefixStatements.push(this.parseExprStmtFromString(`this.${paramName} = ${paramName}`));
                }

                this.nodeManager.addNode(param, paramStart);
                this.context.pop();
            } while (this.reader.readToken(","));

            this.reader.expectToken(")");
        }

        let returns: Type = null;
        if (!isConstructor) // in case of constructor, "returns" won't be used
            returns = this.reader.readToken(":") ? this.parseType() : this.missingReturnTypeIsVoid ? new VoidType() : null;

        let body: Block = null;
        if (declarationOnly) {
            this.reader.expectToken(";");
        } else {
            body = this.parseBlock();
            if (body === null)
                this.reader.fail("method body is missing");

            body.statements = bodyPrefixStatements.concat(body.statements);
        }

        return new MethodSignature(params, fields, body, returns);
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

        const baseInterfaces: Type[] = [];
        if (this.reader.readToken("extends")) {
            do {
                baseInterfaces.push(new UnresolvedType(this.reader.expectIdentifier()));
            } while (this.reader.readToken(","))
        }

        const methods: { [name: string]: Method } = {};
        const fields: { [name: string]: Field } = {};

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const memberLeadingTrivia = this.reader.readLeadingTrivia();

            const memberStart = this.reader.offset;
            const memberName = this.parseIdentifierOrString();
            if (this.reader.readToken(":")) {
                this.context.push(`F:${memberName}`);

                const fieldType = this.parseType();
                this.reader.expectToken(";");

                const field = new Field(memberName, fieldType, null, Visibility.Public, false, memberLeadingTrivia);
                fields[field.name] = field;

                this.nodeManager.addNode(field, memberStart);
                this.context.pop();
            } else {
                this.context.push(`M:${memberName}`);
                const methodTypeArgs = this.parseGenericsArgs();
                this.reader.expectToken("("); // method
    
                const sig = this.parseMethodSignature(/* isConstructor = */ false, /* declarationOnly = */ true);
    
                const method = new Method(memberName, methodTypeArgs, sig.params, sig.body, Visibility.Public, false, sig.returns, memberLeadingTrivia);
                methods[method.name] = method;
                this.nodeManager.addNode(method, memberStart);
                this.context.pop();
            }
        }

        const intf = new Interface(intfName, intfTypeArgs, baseInterfaces, methods, isExported, leadingTrivia);
        this.nodeManager.addNode(intf, intfStart);
        this.context.pop();
        return intf;
    }

    parseSpecifiedType() {
        const typeName = this.reader.readIdentifier();
        const typeArgs = this.parseTypeArgs();
        return new UnresolvedType(typeName, typeArgs);
    }

    parseClass(leadingTrivia: string, isExported: boolean) {
        const clsModifiers = this.reader.readModifiers(["declare", "abstract"]);
        const declarationOnly = clsModifiers.includes("declare");
        if (!this.reader.readToken("class")) return null;
        const clsStart = this.reader.prevTokenOffset;
        
        const name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${name}`);

        const typeArgs = this.parseGenericsArgs();
        const baseClass = this.reader.readToken("extends") ? this.parseSpecifiedType() : null;

        const baseInterfaces: Type[] = [];
        if (this.reader.readToken("implements")) {
            do {
                baseInterfaces.push(this.parseSpecifiedType());
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
            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private", "readonly", "async"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? Visibility.Private :
                modifiers.includes("protected") ? Visibility.Protected : Visibility.Public;

            const memberName = this.parseIdentifierOrString();
            const methodTypeArgs = this.parseGenericsArgs();
            if (this.reader.readToken("(")) { // method
                const isConstructor = memberName === "constructor";

                let member: IMethodBase;
                const sig = this.parseMethodSignature(isConstructor, declarationOnly);
                if (isConstructor) {
                    member = constructor = new Constructor(sig.params, sig.body, memberLeadingTrivia);
                    for (const field of sig.fields)
                        fields[field.name] = field;
                } else {
                    const method = new Method(memberName, methodTypeArgs, sig.params, sig.body, visibility, isStatic, sig.returns, memberLeadingTrivia);
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

                const typeAndInit = this.parseTypeAndInit();
                this.reader.expectToken(";");

                const field = new Field(memberName, typeAndInit.type, typeAndInit.init, visibility, isStatic, memberLeadingTrivia);
                fields[field.name] = field;

                this.nodeManager.addNode(field, memberStart);
                this.context.pop();
            }
        }

        const cls = new Class(name, typeArgs, baseClass, baseInterfaces, fields, properties, constructor, methods, isExported, leadingTrivia);
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

        const curr = currFile.split('/');
        curr.pop(); // filename does not matter
        for (const part of relPath.split('/')) {
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
            const path = importFile.split('/');
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

        let importAllAlias = null;
        const nameAliases: { [name: string]: string } = {};

        if (this.reader.readToken("*")) {
            this.reader.expectToken("as");
            importAllAlias = this.reader.expectIdentifier();
        } else {
            this.reader.expectToken("{");
            do {
                if (this.reader.peekToken("}")) break;
    
                const imp = this.reader.expectIdentifier();
                const importAs = this.reader.readToken("as") ? this.reader.readIdentifier() : null;
                nameAliases[imp] = importAs;
                this.nodeManager.addNode(imp, this.reader.prevTokenOffset);
            } while(this.reader.readToken(","));
            this.reader.expectToken("}");
        }

        this.reader.expectToken("from");
        const moduleName = this.reader.expectString();
        this.reader.expectToken(";");

        const importScope = this.exportScope ? TypeScriptParser2.calculateImportScope(this.exportScope, moduleName) : null;
        
        const imports = [];
        for (const name of Object.keys(nameAliases))
            imports.push(new Import(importScope, false, [new UnresolvedImport(name)], nameAliases[name], leadingTrivia));

        if (importAllAlias !== null)
            imports.push(new Import(importScope, true, null, importAllAlias, leadingTrivia));
        //this.nodeManager.addNode(imports, importStart);
        return imports;
    }

    parseSourceFile() {
        const imports: Import[] = [];
        const enums: { [name: string]: Enum } = {};
        const intfs: { [name: string]: Interface } = {};
        const classes: { [name: string]: Class } = {};
        const funcs: { [name: string]: GlobalFunction } = {};
        while (true) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            if (this.reader.eof) break;

            const imps = this.parseImport(leadingTrivia);
            if (imps !== null) {
                for (const imp of imps)
                    imports.push(imp);
                continue;
            }

            const modifiers = this.reader.readModifiers(["export"]);
            const isExported = modifiers.includes("export");

            const cls = this.parseClass(leadingTrivia, isExported);
            if (cls !== null) {
                classes[cls.name] = cls;
                continue;
            }

            const enumObj = this.parseEnum(leadingTrivia, isExported);
            if (enumObj !== null) {
                enums[enumObj.name] = enumObj;
                continue;
            }

            const intf = this.parseInterface(leadingTrivia, isExported);
            if (intf !== null) {
                intfs[intf.name] = intf;
                continue;
            }

            if (this.reader.readToken("function")) {
                const funcName = this.readIdentifier();
                this.reader.expectToken("(");
                const sig = this.parseMethodSignature(false, false);
                funcs[funcName] = new GlobalFunction(funcName, sig.params, sig.body, sig.returns, isExported, leadingTrivia);
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
        
        return new SourceFile(imports, intfs, classes, enums, funcs, new Block(stmts), this.path, this.exportScope);
    }

    parse() {
        return this.parseSourceFile();
    }

    static parseFile(source: string, path: SourcePath = null) {
        return new TypeScriptParser2(source, path).parseSourceFile();
    }
}