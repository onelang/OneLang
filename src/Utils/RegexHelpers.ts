export function regexMatches(regex: RegExp, value: string) {
    var matches: RegExpExecArray[] = [];
    var match: RegExpExecArray;
    while (match = regex.exec(value))
        matches.push(match);
    return matches;
}