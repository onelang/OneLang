class TokenType {
  static var end_token: String = "EndToken"
  static var whitespace: String = "Whitespace"
  static var identifier: String = "Identifier"
  static var operator_x: String = "Operator"
  static var no_initializer: String
}

class TestClass {
  func testMethod() -> String {
      let casing_test = TokenType.end_token
      return casing_test
  }
}

TestClass().testMethod()