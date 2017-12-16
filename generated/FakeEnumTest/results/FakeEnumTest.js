class TokenType {
}

TokenType.endToken = "EndToken";
TokenType.whitespace = "Whitespace";
TokenType.identifier = "Identifier";
TokenType.operatorX = "Operator";

class TestClass {
  testMethod() {
    const casing_test = TokenType.endToken;
    return casing_test;
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}