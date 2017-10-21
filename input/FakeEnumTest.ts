class TokenType { 
    static EndToken: string = "EndToken";
    static Whitespace: string = "Whitespace";
    static Identifier: string = "Identifier";
    static OperatorX: string = "Operator";
    static NoInitializer: string;
}

class TestClass {
    testMethod(): string {
        const casingTest = TokenType.EndToken;
        return casingTest;
    }
}