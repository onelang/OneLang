enum TokenKind { Number, Identifier, Operator_, String_ }

export class Token
{
    constructor(public kind: TokenKind, public value: string) { }
}

export class ExprLangLexer {
    offset = 0;
    tokens: Token[] = [];

    fail(message: string) {
        let endOffset = this.offset + 30;
        if (endOffset > this.expression.length)
            endOffset = this.expression.length;
        const context = this.expression.substring(this.offset, endOffset) + "...";
        OneError.raise(`TokenizerException: ${message} at '${context}' (offset: ${this.offset})`);
    }

    constructor(public expression: string, public operators: string[]) {
        if (!this.tryToReadNumber()) {
            this.tryToReadOperator();
            this.tryToReadLiteral();
        }

        while(this.hasMoreToken()) {
            if (!this.tryToReadOperator())
                this.fail("expected operator here");

            if (!this.tryToReadLiteral())
                this.fail("expected literal here");
        }
    }

    hasMoreToken(): boolean {
        this.skipWhitespace();
        return !this.eof();
    }

    add(kind: TokenKind, value: string) {
        this.tokens.push(new Token(kind, value));
        this.offset += value.length;
    }

    tryToMatch(pattern: string): string {
        const matches = OneRegex.matchFromIndex(pattern, this.expression, this.offset);
        return matches === null ? "" : matches[0];
    }

    tryToReadOperator(): boolean {
        this.skipWhitespace();
        for (const op of this.operators)
            if (this.expression.startsWith(op, this.offset)) {
                this.add(TokenKind.Operator_, op);
                return true;
            }
        return false;
    }

    tryToReadNumber(): boolean {
        this.skipWhitespace();

        const number = this.tryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
        if (number === "") return false;
        
        this.add(TokenKind.Number, number);

        if (this.tryToMatch("[0-9a-zA-Z]") !== "")
            this.fail("invalid character in number");

        return true;
    }

    tryToReadIdentifier(): boolean {
        this.skipWhitespace();
        const identifier = this.tryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
        if (identifier === "") return false;

        this.add(TokenKind.Identifier, identifier);
        return true;
    }

    tryToReadString(): boolean {
        this.skipWhitespace();
        
        let match = this.tryToMatch("'(\\\\'|[^'])*'");
        if (match === "")
            match = this.tryToMatch('"(\\\\"|[^"])*"');
        if (match === "") return false;

        let str = match.substr(1, match.length - 2);
        str = match[0] === "'" ? str.replace("\\'", "'") : str.replace('\\"', '"');
        this.tokens.push(new Token(TokenKind.String_, str));
        this.offset += match.length;
        return true;
    }

    eof(): boolean { return this.offset >= this.expression.length; }

    skipWhitespace() {
        while(!this.eof()) {
            const c = this.expression[this.offset];
            if (c == ' ' || c == '\n' || c == '\t' || c == '\r')
                this.offset++;
            else
                break;
        }
    }

    tryToReadLiteral(): boolean {
        const success = this.tryToReadIdentifier() || this.tryToReadNumber() || this.tryToReadString();
        return success;
    }
}

class TestClass {
    testMethod() {
        const lexer = new ExprLangLexer("1+2", ["+"]);
        let result = "";
        for (const token of lexer.tokens) {
            if (result != "")
                result += ", ";
            result += token.value;
        }
            
        console.log(`[${lexer.tokens.length}]: ${result}`);
    }
}