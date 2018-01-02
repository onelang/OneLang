class TokenType {
}

TokenType.endToken = "EndToken";
TokenType.whitespace = "Whitespace";
TokenType.identifier = "Identifier";
TokenType.operatorX = "Operator";

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