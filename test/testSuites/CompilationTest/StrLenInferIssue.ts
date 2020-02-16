class StrLenInferIssue {
    static test(str: string): number {
        return str.length;
    }
}

console.log(StrLenInferIssue.test("hello"));