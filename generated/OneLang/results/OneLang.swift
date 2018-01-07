class TokenType {
  static var endToken: String = "EndToken"
  static var whitespace: String = "Whitespace"
  static var identifier: String = "Identifier"
  static var operatorX: String = "Operator"
}

class Token {
  var value: String
  var isOperator: Bool

  init(value: String, isOperator: Bool) {
      self.value = value
      self.isOperator = isOperator
  }
}

class StringHelper {
  class func startsWithAtIndex(str: String, substr: String, idx: Int) -> Bool {
      return String(str[str.index(str.startIndex, offsetBy: idx) ..< str.index(str.startIndex, offsetBy: idx + substr.count)]) == substr
  }
}

class Tokenizer {
  var offset: Int
  var text: String
  var operators: [String]?

  init(text: String, operators: [String]) {
      self.text = text
      self.operators = operators
      self.offset = 0
  }

  func getTokenType() -> String {
      if self.offset >= self.text.count {
          return TokenType.endToken
      }
      
      let c = String(self.text[self.text.index(self.text.startIndex, offsetBy: self.offset)])
      return c == " " || c == "\n" || c == "\t" || c == "\r" ? TokenType.whitespace : ("A" <= c && c <= "Z") || ("a" <= c && c <= "z") || ("0" <= c && c <= "9") || c == "_" ? TokenType.identifier : TokenType.operatorX
  }

  func tokenize() -> [Token]? {
      var result: [Token]? = [Token]()
      
      while self.offset < self.text.count {
          let charType = self.getTokenType()
          
          if charType == TokenType.whitespace {
              while self.getTokenType() == TokenType.whitespace {
                  self.offset += 1
              }
          } else if charType == TokenType.identifier {
              let startOffset = self.offset
              while self.getTokenType() == TokenType.identifier {
                  self.offset += 1
              }
              let identifier = String(self.text[self.text.index(self.text.startIndex, offsetBy: startOffset) ..< self.text.index(self.text.startIndex, offsetBy: self.offset)])
              result!.append(Token(value: identifier, isOperator: false))
          } else {
              var op = ""
              for currOp in self.operators {
                  if StringHelper.startsWithAtIndex(str: self.text, substr: currOp, idx: self.offset) {
                      op = currOp
                      break
                  }
              }
              
              if op == "" {
                  break
              }
              
              self.offset += op.count
              result!.append(Token(value: op, isOperator: true))
          }
      }
      
      return result
  }
}

class TestClass {
  func testMethod() -> Void {
      let operators: [String]? = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."]
      
      let input = "hello * 5"
      let tokenizer: Tokenizer? = Tokenizer(text: input, operators: operators)
      let result: [Token]? = tokenizer!.tokenize()
      
      print("token count:")
      print(result!.count)
      for item in result {
          print(item!.value + "(" + (item!.isOperator ? "op" : "id") + ")")
      }
  }
}

TestClass().testMethod()