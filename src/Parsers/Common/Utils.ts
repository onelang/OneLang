export class Utils {
    static getPadLen(line: string) {
        for (let i = 0; i < line.length; i++)
            if (line[i] !== ' ')
                return i;
        return -1; // whitespace line => pad === 0
    }

    static deindent(str: string) {
        const lines = str.split(/\n/g);
        if (lines.length === 1) return str;
    
        if (this.getPadLen(lines[0]) === -1)
            lines.shift();
    
        const minPadLen = Math.min.apply(null, lines.map(x => this.getPadLen(x)).filter(x => x !== -1));
        const newStr = lines.map(x => x.length !== 0 ? x.substr(minPadLen) : x).join("\n");
        return newStr;
    }
}
