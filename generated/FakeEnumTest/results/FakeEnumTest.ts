class TokenType {
  public static endToken: string = "EndToken";
  public static whitespace: string = "Whitespace";
  public static identifier: string = "Identifier";
  public static operatorX: string = "Operator";
  public static noInitializer: string;
}

class TestClass {
  public testMethod() {
    const casing_test = TokenType.endToken!;
    return casing_test;
  }
}

new TestClass().testMethod();