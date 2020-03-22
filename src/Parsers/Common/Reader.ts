import { Utils } from "./Utils";

export class Cursor {
    constructor(public offset: number, public line: number, public column: number, public lineStart: number, public lineEnd: number) { }
}

export class ParseError {
    constructor(public message: string, public cursor: Cursor = null, public reader: Reader = null) { }
}

export class Reader {
    wsOffset = 0;
    offset = 0;
    cursorSearch: CursorPositionSearch;

    lineComment = "//";
    supportsBlockComment = true;
    blockCommentStart = "/*";
    blockCommentEnd = "*/";
    commentDisabled = false;

    identifierRegex = "[A-Za-z_][A-Za-z0-9_]*";
    numberRegex = "[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)";

    errors: ParseError[] = [];
    errorCallback: (error: ParseError) => void = null;

    wsLineCounter = 0;
    moveWsOffset = true;
    prevTokenOffset = -1;

    constructor(public input: string) {
        this.cursorSearch = new CursorPositionSearch(input);
    }

    get eof() { return this.offset >= this.input.length; }

    get cursor() { return this.cursorSearch.getCursorForOffset(this.offset); }

    linePreview(cursor: Cursor) {
        const line = this.input.substring(cursor.lineStart, cursor.lineEnd - 1);
        return `${line}\n${" ".repeat(cursor.column - 1)}^^^`;
    }

    get preview() {
        let preview = this.input.substr(this.offset, 20).replace(/\n/g, "\\n");
        if (preview.length === 20)
            preview += "...";
        return preview;
    }

    fail(message: string, offset = -1) {
        const error = new ParseError(message, this.cursorSearch.getCursorForOffset(offset === -1 ? this.offset : offset), this);
        this.errors.push(error);

        if (this.errorCallback)
            this.errorCallback(error);
        else
            throw new Error(`${message} at ${error.cursor.line}:${error.cursor.column}\n${this.linePreview(error.cursor)}`);
    }

    skipWhitespace(includeInTrivia = false) {
        for (; this.offset < this.input.length; this.offset++) {
            const c = this.input[this.offset];
            
            if (c === '\n')
                this.wsLineCounter++;

            if (!(c === '\n' || c === '\r' || c === '\t' || c === ' '))
                break;
        }

        if (!includeInTrivia)
            this.wsOffset = this.offset;
    }

    skipUntil(token: string) {
        const index = this.input.indexOf(token, this.offset);
        if (index === -1)
            return false;
        this.offset = index + token.length;
        if (this.moveWsOffset)
            this.wsOffset = this.offset;
        return true;
    }

    skipLine() {
        if(!this.skipUntil("\n"))
            this.offset = this.input.length;
    }

    isAlphaNum(c: string) {
        return ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9') || c === '_';
    }

    peekToken(token: string) {
        this.skipWhitespaceAndComment();

        if (this.input.startsWith(token, this.offset)) {
            // TODO: hackish way to make sure space comes after word tokens
            if (this.isAlphaNum(token[token.length - 1]) && this.isAlphaNum(this.input[this.offset + token.length])) return false;
            return true;
        } else {
            return false;
        }
    }

    readToken(token: string) {
        if (this.peekToken(token)) {
            this.prevTokenOffset = this.offset;
            this.wsOffset = this.offset = this.offset + token.length;
            return true;
        }
        return false;
    }

    readAnyOf(tokens: string[]) {
        for (const token of tokens)
            if (this.readToken(token))
                return token;
        return null;
    }

    expectToken(token: string, errorMsg: string = null) {
        if (!this.readToken(token))
            this.fail(errorMsg || `expected token '${token}'`);
    }

    expectString(errorMsg: string = null) {
        const result = this.readString();
        if (result === null)
            this.fail(errorMsg || `expected string`);
        return result;
    }

    expectOneOf(tokens: string[]) {
        const result = this.readAnyOf(tokens);
        if (result === null)
            this.fail(`expected one of ${tokens.map(x => `'${x}'`).join(", ")}`);
        return result;
    }

    static matchFromIndex(pattern: string, input: string, offset: number) {
        const regex = new RegExp(pattern, "gy");
        regex.lastIndex = offset;
        const matches = regex.exec(input);
        return matches === null ? null : Array.from(matches);
    }

    peekRegex(pattern: string) {
        const matches = Reader.matchFromIndex(pattern, this.input, this.offset);
        return matches;
    }

    readRegex(pattern: string) {
        const matches = Reader.matchFromIndex(pattern, this.input, this.offset);
        if (matches !== null) {
            this.prevTokenOffset = this.offset;
            this.wsOffset = this.offset = this.offset + matches[0].length;
        }
        return matches;
    }

    skipWhitespaceAndComment() {
        if (this.commentDisabled) return;

        this.moveWsOffset = false;
        while (true) {
            this.skipWhitespace(true);
            if (this.input.startsWith(this.lineComment, this.offset)) {
                this.skipLine();
            } else if (this.supportsBlockComment && this.input.startsWith(this.blockCommentStart, this.offset)) {
                if (!this.skipUntil(this.blockCommentEnd))
                    this.fail(`block comment end ("${this.blockCommentEnd}") was not found`);
            } else {
                break;
            }
        }
        this.moveWsOffset = true;
    }

    readLeadingTrivia() {
        this.skipWhitespaceAndComment();
        const thisLineStart = this.input.lastIndexOf("\n", this.offset);
        if (thisLineStart <= this.wsOffset)
            return "";

        let result = this.input.substring(this.wsOffset, thisLineStart + 1);
        result = Utils.deindent(result);
        this.wsOffset = thisLineStart;
        return result;
    }

    readIdentifier() {
        this.skipWhitespace();
        const idMatch = this.readRegex(this.identifierRegex);
        if (idMatch === null) return null;

        return idMatch[0];
    }

    readNumber() {
        this.skipWhitespace();
        const numMatch = this.readRegex(this.numberRegex);
        if (numMatch === null) return null;

        if (this.readRegex("[0-9a-zA-Z]") !== null)
            this.fail("invalid character in number");

        return numMatch[0];
    }

    readString() {
        this.skipWhitespace();
        const strMatch = this.readRegex("'((?<!\\\\)\\\\'|[^'\n])*'") || this.readRegex('"((?<!\\\\)\\\\"|[^"\n])*"');
        if (!strMatch) return null;

        let str = strMatch[0].substr(1, strMatch[0].length - 2);
        str = strMatch[0] === "'" ? str.replace(/\\'/g, "'") : str.replace(/\\"/g, '"');
        // TODO: hack: this logic is langauge-dependent
        str = str.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/\\\\/g, "\\");
        return str;
    }

    expectIdentifier(errorMsg: string = null) {
        const id = this.readIdentifier();
        if (id === null)
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
}

class CursorPositionSearch {
    lineOffsets = [0];

    constructor(public input: string) {
        for (let i = 0; i < input.length; i++)
            if (input[i] === '\n')
                this.lineOffsets.push(i + 1);
        this.lineOffsets.push(input.length);
    }

    getLineIdxForOffset(offset: number) {
        let low = 0;
        let high = this.lineOffsets.length - 1;

        while (low <= high) {
            const middle = Math.floor((low + high) / 2);
            const middleOffset = this.lineOffsets[middle];
            if (offset == middleOffset)
                return middle;
            else if (offset <= middleOffset)
                high = middle - 1;
            else
                low = middle + 1;
        }

        return low - 1;
    }

    getCursorForOffset(offset: number): Cursor {
        const lineIdx = this.getLineIdxForOffset(offset);
        const lineStart = this.lineOffsets[lineIdx];
        const lineEnd = this.lineOffsets[lineIdx + 1];
        const column = offset - lineStart + 1;
        if (column < 1)
            throw new Error("Column should not be < 1");
        return new Cursor(offset, lineIdx + 1, offset - lineStart + 1, lineStart, lineEnd);
    }
}
