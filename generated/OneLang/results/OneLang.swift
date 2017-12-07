class TokenType {
  static var end_token: String = "EndToken"
  static var whitespace: String = "Whitespace"
  static var identifier: String = "Identifier"
  static var operator_x: String = "Operator"
}

class Token {
  var value: String
  var is_operator: Bool

  init(value: String, is_operator: Bool) {
      self.is_operator = is_operator
      self.value = value
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
  var operators: [String]

  init(text: String, operators: [String]) {
      self.operators = operators
      self.text = text
      self.offset = 0
  }

  func getTokenType() -> String {
      if self.offset >= self.text.count {
          return TokenType.end_token
      }
      
      let c = String(self.text[self.text.index(self.text.startIndex, offsetBy: self.offset)])
      return c == " " || c == "\n" || c == "\t" || c == "\r" ? TokenType.whitespace : ("A" <= c && c <= "Z") || ("a" <= c && c <= "z") || ("0" <= c && c <= "9") || c == "_" ? TokenType.identifier : TokenType.operator_x
  }

  func tokenize() -> [Token] {
      var result = [Token]()
      
      while self.offset < self.text.count {
          let char_type = self.getTokenType()
          
          if char_type == TokenType.whitespace {
              while self.getTokenType() == TokenType.whitespace {
                  self.offset += 1
              }
          } else if char_type == TokenType.identifier {
              let start_offset = self.offset
              while self.getTokenType() == TokenType.identifier {
                  self.offset += 1
              }
              let identifier = String(self.text[self.text.index(self.text.startIndex, offsetBy: start_offset) ..< self.text.index(self.text.startIndex, offsetBy: self.offset)])
              result.append(Token(value: identifier, is_operator: false))
          } else {
              var op = ""
              for curr_op in self.operators {
                  if StringHelper.startsWithAtIndex(str: self.text, substr: curr_op, idx: self.offset) {
                      op = curr_op
                      break
                  }
              }
              
              if op == "" {
                  break
              }
              
              self.offset += op.count
              result.append(Token(value: op, is_operator: true))
          }
      }
      
      return result
  }
}

class TestClass {
  func testMethod() -> Void {
      let operators = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."]
      
      let input = "hello * 5"
      let tokenizer = Tokenizer(text: input, operators: operators)
      let result = tokenizer.tokenize()
      
      print("token count:")
      print(result.count)
      for item in result {
          print(item.value + "(" + (item.is_operator ? "op" : "id") + ")")
      }
  }
}

TestClass().testMethod()