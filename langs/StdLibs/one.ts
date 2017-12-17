class OneRegex {
    static matchFromIndex(pattern: string, input: string, offset: number) {
        const regex = new RegExp(pattern, "gy");
        regex.lastIndex = offset;
        const matches = regex.exec(input);
        return matches === null ? null : Array.from(matches);
    }
}