class TestClass {
    reverseString(str: string): string {
        let result = "";
        for (let i = str.length - 1; i >= 0; i--)
            result += str[i];
        return result;
    }

    testMethod(): string {
        console.log(this.reverseString("print value"));
        return "return value";
    }
}