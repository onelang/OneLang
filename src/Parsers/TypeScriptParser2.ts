import * as one from "../StdLib/one";
import { OneAst as ast } from "../One/Ast";

class Cursor {
    constructor(public offset: number, public line: number, public column: number) { }
}

class CursorPositionSearch {
    lineOffsets = [0];

    constructor(public input: string) {
        for (let i = 0; i < input.length; i++)
            if (input[i] === '\n')
                this.lineOffsets.push(i + 1);
    }

    getLineIdxForOffset(offset: number) {
        let start = 0, end = this.lineOffsets.length - 1;

        while (start < end) {
            const middle = Math.floor((start + end) / 2);
            const middleOffset = this.lineOffsets[middle];
            if (offset < middleOffset)
                end = middle - 1;
            else if (offset > middleOffset)
                start = middle + 1;
            else
                return middle;
        }

        if (start !== end)
            debugger;

        return start - 1;
    }

    getCursorForOffset(offset: number) {
        const lineIdx = this.getLineIdxForOffset(offset);
        return new Cursor(offset, lineIdx + 1, offset - this.lineOffsets[lineIdx] + 1);
    }
}

class ParseError {
    constructor(public message: string, public offset: number = -1, public reader: Reader = null) { }
}

class Reader {
    offset = 0;
    line = 0;
    cursorSearch: CursorPositionSearch;

    lineComment = "//";
    supportsBlockComment = true;
    blockCommentStart = "/*";
    blockCommentEnd = "*/";

    errors: ParseError[] = [];

    constructor(public input: string) {
        this.cursorSearch = new CursorPositionSearch(input);
    }

    get eof() { return this.offset >= this.input.length; }

    get preview() {
        let preview = this.input.substr(this.offset, 20).replace(/\n/g, "\\n");
        if (preview.length === 20)
            preview += "...";
        return preview;
    }

    fail(message: string) {
        this.errors.push(new ParseError(message, this.offset, this));
        const cursor = this.cursorSearch.getCursorForOffset(this.offset);
        throw new Error(`${message} at ${cursor.line}:${cursor.column}: "${this.preview}"`);
    }

    skipWhitespace() {
        for (; this.offset < this.input.length; this.offset++) {
            const c = this.input[this.offset];
            const isNl = c === '\n';
            const isWs = isNl || c === '\r' || c === '\t' || c === ' ';

            if (!isWs)
                break;

            if (isNl)
                this.line++;
        }
    }

    skipUntil(token: string) {
        const index = this.input.indexOf(token, this.offset);
        if (index === -1)
            return false;
        this.offset += index + token.length;
        return true;
    }

    skipLine() {
        return this.skipUntil("\n");
    }

    readToken(token: string) {
        this.skipWhitespace();

        // TODO: hackish way to make sure space comes after word tokens
        if ('a' <= token[0] && token[0] <= 'z')
            token += ' ';

        if (this.input.startsWith(token, this.offset)) {
            this.offset += token.length;
            return true;
        } else {
            return false;
        }
    }

    expectToken(token: string, errorMsg: string = null) {
        if (!this.readToken(token))
            this.fail(errorMsg || `expected token '${token}'`);
    }

    readRegex(pattern: string) {
        this.skipWhitespace();

        const matches = one.Regex.matchFromIndex(pattern, this.input, this.offset);
        if (matches !== null)
            this.offset += matches[0].length;
        return matches;
    }

    skipWhitespaceAndComment() {
        while (true) {
            this.skipWhitespace();
            if (this.readToken(this.lineComment)) {
                this.skipLine();
            } else if (this.supportsBlockComment && this.readToken(this.blockCommentStart)) {
                if (!this.skipUntil(this.blockCommentEnd))
                    this.fail(`block comment end ("${this.blockCommentEnd}") was not found`);
            } else {
                break;
            }
        }
    }
}

export class TypeScriptParser2 extends Reader {
    context: string[] = [];

    fail(message: string) {
        super.fail(`[TypeScriptParser] ${message} (context: ${this.context.join("/")})`);
    }

    readLeadingTrivia() {
        this.skipWhitespace();
        const startOffset = this.offset;
        this.skipWhitespaceAndComment();
        const result = this.input.substring(startOffset, this.offset);
        return result;
    }

    readIdentifier() {
        const result = this.readRegex("[A-Za-z_][A-Za-z0-9_]*\\b");
        return result === null ? "" : result[0];
    }

    expectIdentifier(errorMsg: string = null) {
        const id = this.readIdentifier();
        if (id === "")
            this.fail(errorMsg || "expected identifier");
        return id;
    }

    readModifiers(modifiers: string[]) {
        const result = [];
        while (true) {
            let success = false;
            for (const modifier of modifiers) {
                if (this.readToken(modifier)) {
                    result.push(modifier);
                    success = true;
                }
            }
            if (!success)
                break;
        }
        return result;
    }

    parseType() {
        const typeName = this.readIdentifier();

        let type: ast.Type;
        if (typeName === "string") {
            type = ast.Type.Class("TsString");
        } else if (typeName === "boolean") {
            type = ast.Type.Class("TsBoolean");
        } else if (typeName === "number") {
            type = ast.Type.Class("TsNumber");
        } else {
            type = ast.Type.Class(typeName);
            if (this.readToken("<")) {
                do {
                    const generics = this.parseType();
                    type.typeArguments.push(generics);
                } while(this.readToken(","));
                this.expectToken(">");
            }
        }

        while (this.readToken("[]"))
            type = ast.Type.Class("TsArray", [type]);

        return type;
    }

    parseExpression() {
        this.fail("expression parsing is not implemented yet");
        return null;
    }

    parseVarDeclTypeAndInit(varDecl: ast.VariableDeclaration, optional: boolean = false) {
        if (this.readToken(":"))
            varDecl.type = this.parseType();

        if (this.readToken("="))
            varDecl.initializer = this.parseExpression();

        if (!optional && varDecl.type === null && varDecl.initializer === null)
            this.fail(`expected type declaration or initializer`);
    }

    parseBlock() {
        const block = <ast.Block> { statements: [] };

        this.expectToken("{");
        do {
            let statement: ast.Statement = null;

            const varDeclMatches = this.readRegex("(const|let|var)\\b");
            if (varDeclMatches !== null) {
                const varDecl = statement = <ast.VariableDeclaration> { stmtType: ast.StatementType.VariableDeclaration };
                varDecl.name = this.expectIdentifier("expected variable name");
                this.parseVarDeclTypeAndInit(varDecl);
            }

            if (statement === null)
                this.fail("unknown statement");

            block.statements.push(statement);
        } while(!this.readToken("}"));

        return block;
    }

    tryToParseClass() {
        if (!this.readToken("class")) return null;

        const cls = <ast.Class> { methods: {}, fields: {} };
        cls.name = this.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`${cls.name}`);

        this.expectToken("{");
        while(!this.readToken("}")) {
            const leadingTrivia = this.readLeadingTrivia();

            const modifiers = this.readModifiers(["static", "public", "protected", "private"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? ast.Visibility.Private :
                modifiers.includes("protected") ? ast.Visibility.Protected : ast.Visibility.Public;

            const memberName = this.readIdentifier();
            if (this.readToken("(")) { // method
                const method = <ast.Method> { name: memberName, static: isStatic, visibility, leadingTrivia, parameters: [] };
                cls.methods[method.name] = method;
                this.context.push(`${method.name}`);

                do {
                    const param = <ast.MethodParameter> {};
                    method.parameters.push(param);

                    param.name = this.readIdentifier();
                    this.context.push(`argument: ${param.name}`);
                    this.parseVarDeclTypeAndInit(param);
                    this.context.pop();
                } while (this.readToken(","));

                this.expectToken(")");
                if (this.readToken(":"))
                    method.returns = this.parseType();

                method.body = this.parseBlock();

                this.context.pop();
            } else {
                const field = <ast.Field> { name: memberName, static: isStatic, visibility, leadingTrivia };
                cls.fields[field.name] = field;
                this.context.push(`${field.name}`);

                this.parseVarDeclTypeAndInit(field);
                this.expectToken(";");

                this.context.pop();
            }
        }

        this.context.pop();
        return cls;
    }

    parseFile() {
        while (!this.eof) {
            const leadingTrivia = this.readLeadingTrivia();
            const cls = this.tryToParseClass();
            if (cls === null)
                this.fail("expected 'class' here");
        }
    }

    parse() {
        this.parseFile();
    }
}