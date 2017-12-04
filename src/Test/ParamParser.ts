export class ParamParser {
    pos = 0;
    params: { [name: string]: string|boolean } = { };

    constructor(public str: string) { }

    readToken(...tokens: string[]) {
        for (const token of tokens)
            if (this.str.startsWith(token, this.pos)) {
                this.pos += token.length;
                return token;
            }
        return null;
    }

    readUntil(...tokens: string[]) {
        const startPos = this.pos;
        let token = null;
        for (; this.pos < this.str.length; this.pos++)
            if (token = this.readToken(...tokens))
                break;

        const value = this.str.substring(startPos, this.pos - (token||"").length);
        return { value, token };
    }

    parse() {
        while (this.pos < this.str.length) {
            const key = this.readUntil("=", " ");
            if(key.token !== "=")
                this.params[key.value] = true;
            else {
                const quote = this.readToken("'", "\"");
                const value = this.readUntil(quote || " ").value;
                this.params[key.value] = value.replace(/\\n/g, "\n");
            }
        }

        return this.params;
    }
}
