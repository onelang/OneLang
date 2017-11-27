class TokenType { 
    static EndToken: string = "EndToken";
    static Whitespace: string = "Whitespace";
    static Identifier: string = "Identifier";
    static OperatorX: string = "Operator";
}

class Token
{
    constructor(public value: string, public isOperator: boolean) { }
}

class StringHelper {
    static startsWithAtIndex(str: string, substr: string, idx: number): boolean {
        return str.substr(idx, substr.length) == substr;
    }
}

export class Tokenizer
{
    offset: number;

    constructor(public text: string, public operators: string[]) {
        this.offset = 0;
    }

    getTokenType(): string {
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
            const charType = this.getTokenType();

            if (charType == TokenType.Whitespace)
                while (this.getTokenType() == TokenType.Whitespace)
                    this.offset++;
            else if (charType == TokenType.Identifier)
            {
                const startOffset = this.offset;
                while (this.getTokenType() == TokenType.Identifier)
                    this.offset++;
                const identifier = this.text.substring(startOffset, this.offset);
                result.push(new Token(identifier, false));
            }
            else
            {
                let op = "";
                for (const currOp of this.operators)
                    if(StringHelper.startsWithAtIndex(this.text, currOp, this.offset)) {
                        op = currOp;
                        break;
                    }

                if (op == "")
                    return null;

                this.offset += op.length;
                result.push(new Token(op, true));
            }
        }

        return result;
    }
}

class TestClass {
    testMethod() {
        const operators = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", 
            "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."];

        const input = "hello * 5";
        const tokenizer = new Tokenizer(input, operators);
        const result = tokenizer.tokenize();

        console.log("token count:");
        console.log(result.length);
        for (const item of result)
            console.log(item.value + "(" + (item.isOperator ? "op" : "id") + ")");
    }
}