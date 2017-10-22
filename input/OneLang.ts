class TokenType { 
    static EndToken: string = "EndToken";
    static Whitespace: string = "Whitespace";
    static Identifier: string = "Identifier";
    static OperatorX: string = "Operator";
    static NoInitializer: string;
}

class Token
{
    constructor(public value: string, public isOperator: boolean) { }
}

class StringHelper {
    static startsWithAtIndex(str: string, substr: string, idx: number) {
    }
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
                TokenType.OperatorX;
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
                let op: string = null;
                for (const currOp of this.operators)
                    if(this.text.startsWith(currOp, this.offset)) {
                        op = currOp;
                        break;
                    }

                if (!op)
                    return null;

                this.offset += op.length;
                result.push(new Token(op, true));
            }
        }

        return result;
    }
}
