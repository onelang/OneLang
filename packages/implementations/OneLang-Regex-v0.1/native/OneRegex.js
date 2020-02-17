class OneRegex {
    static matchFromIndex(pattern, input, offset) {
        const regex = new RegExp(pattern, "gy");
        regex.lastIndex = offset;
        const matches = regex.exec(input);
        return matches === null ? null : Array.from(matches);
    }
}

module.exports = OneRegex;