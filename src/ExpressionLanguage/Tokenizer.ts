class UnknownTokenException extends Error
{
    constructor(public offset?: number, public dataEnv?: string)
    {
        super(`Unknown token found${offset ? ` at position ${offset}` : ''}${dataEnv ? `: ${dataEnv}...` : ""}`);
    }
}

enum TokenType { EndToken = "EndToken", Whitespace = "Whitespace", Identifier = "Identifier", Operator = "Operator" }

class Token
{
    constructor(public value: string, public isOperator: boolean) { }
}

export class Tokenizer
{
    offset = 0;

    protected constructor(public text: string, public operators: string[]) { }

    getType() {
        if (this.offset >= this.text.length)
            return TokenType.EndToken;

        var c = this.text[this.offset];
        return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType.Whitespace :
            ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType.Identifier :
                TokenType.Operator;
    }

    tokenize(): Token[]
    {
        const result: Token[] = [];

        while (this.offset < this.text.length)
        {
            const charType = this.getType();

            if (charType == TokenType.Whitespace)
                while (this.getType() == TokenType.Whitespace)
                    this.offset++;
            else if (charType == TokenType.Identifier)
            {
                const startOffset = this.offset;
                while (this.getType() == TokenType.Identifier)
                    this.offset++;
                const identifier = this.text.substring(startOffset, this.offset);
                result.push(new Token(identifier, false));
            }
            else
            {
                const op = this.operators.find(op => this.text.startsWith(op, this.offset));
                if (!op)
                    throw new UnknownTokenException(this.offset, this.text.substr(this.offset, 5));
                this.offset += op.length;
                result.push(new Token(op, true));
            }
        }

        return result;
    }

    static tokenize(text: string, operators: string[]) {
        return new Tokenizer(text, operators).tokenize();
    }
}
