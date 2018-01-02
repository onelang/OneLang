class TokenType {
  static endToken: string = "EndToken";
  static whitespace: string = "Whitespace";
  static identifier: string = "Identifier";
  static operatorX: string = "Operator";
  static noInitializer: string;
}

class TestClass {
  testMethod() {
    const casingTest = TokenType.endToken;
    return casingTest;
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}