export class StringUtil {
    static ucFirst(str: string): string { return str[0].toUpperCase() + str.substr(1); }
    // hello
    // @attribute text
    static concatTwoStrings(str1: string, str2: string): string { return str1 + ", " + str2; }
}