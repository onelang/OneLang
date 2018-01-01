import * as one from "../../StdLib/one";

export class Cursor {
    constructor(public offset: number, public line: number, public column: number) { }
}

export class ParseError {
    constructor(public message: string, public cursor: Cursor = null, public reader: Reader = null) { }
}

export class Reader {
    offset = 0;
    line = 1;
    cursorSearch: CursorPositionSearch;

    lineComment = "//";
    supportsBlockComment = true;
    blockCommentStart = "/*";
    blockCommentEnd = "*/";

    identifierRegex = "[A-Za-z_][A-Za-z0-9_]*";
    numberRegex = "[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)";

    errors: ParseError[] = [];
    errorCallback: (error: ParseError) => void = null;

    constructor(public input: string) {
        this.cursorSearch = new CursorPositionSearch(input);
    }

    get eof() { return this.offset >= this.input.length; }

    get cursor() { return this.cursorSearch.getCursorForOffset(this.offset); }

    get preview() {
        let preview = this.input.substr(this.offset, 20).replace(/\n/g, "\\n");
        if (preview.length === 20)
            preview += "...";
        return preview;
    }

    fail(message: string) {
        const error = new ParseError(message, this.cursor, this);
        this.errors.push(error);

        if (this.errorCallback)
            this.errorCallback(error);
        else
            throw new Error(`${message} at ${error.cursor.line}:${error.cursor.column}: "${this.preview}"`);
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
        this.offset = index + token.length;
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

    readAnyOf(tokens: string[]) {
        for (const token of tokens)
            if (this.readToken(token))
                return token;
        return "";
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

    readLeadingTrivia() {
        this.skipWhitespace();
        const startOffset = this.offset;
        this.skipWhitespaceAndComment();
        const result = this.input.substring(startOffset, this.offset);
        return result;
    }

    readIdentifier() {
        const idMatch = this.readRegex(this.identifierRegex);
        if (idMatch === null) return "";

        return idMatch[0];
    }

    readNumber() {
        const numMatch = this.readRegex(this.numberRegex);
        if (numMatch === null) return "";

        if (this.readRegex("[0-9a-zA-Z]") !== null)
            this.fail("invalid character in number");

        return numMatch[0];
    }

    readString() {
        const strMatch = this.readRegex("'(\\\\'|[^'])*'") || this.readRegex('"(\\\\"|[^"])*"');
        if (!strMatch) return "";

        let str = strMatch[0].substr(1, strMatch.length - 2);
        str = strMatch[0] === "'" ? str.replace("\\'", "'") : str.replace('\\"', '"');
        return str;
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
