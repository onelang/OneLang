export class Utils {
    static getPadLen(line: string) {
        for (let i = 0; i < line.length; i++)
            if (line[i] !== ' ')
                return i;
        return -1; // whitespace line => pad === 0
    }

    static deindent(str: string): string {
        const lines = str.split(/\n/g);
        if (lines.length === 1) return str;
    
        if (this.getPadLen(lines[0]) === -1)
            lines.shift();
    
        let minPadLen = 9999;
        for (const padLen of lines.map(x => this.getPadLen(x)).filter(x => x !== -1))
            if (padLen < minPadLen)
                minPadLen = padLen;

        if (minPadLen === 9999) return lines.map(x => "").join("\n");

        // @java final var minPadLen2 = minPadLen;
        const minPadLen2 = minPadLen;
        const newStr = lines.map(x => x.length !== 0 ? x.substr(minPadLen2) : x).join("\n");
        return newStr;
    }
}
