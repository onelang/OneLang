export class StringUtil {
    static ucFirst(str: string) { return str[0].toUpperCase() + str.substr(1); }
    static concatTwoStrings(str1: string, str2: string) { return str1 + ", " + str2; }
}