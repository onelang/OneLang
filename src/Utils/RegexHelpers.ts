export class RegexHelpers {
    static matches(regex: RegExp, value: string): RegExpExecArray[] {
        var matches: RegExpExecArray[] = [];
        var match: RegExpExecArray;
        while (match = regex.exec(value))
            matches.push(match);
        return matches;
    }
}
