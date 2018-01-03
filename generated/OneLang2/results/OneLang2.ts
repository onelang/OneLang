const one = require('one');

enum TokenKind {
  Number = "Number",
  Identifier = "Identifier",
  Operator_ = "Operator_",
  String_ = "String_",
}

class Token {
  kind: TokenKind;
  value: string;

  constructor(kind: TokenKind, value: string) {
      this.kind = kind;
      this.value = value;
  }
}

class ExprLangLexer {
  offset: number = 0;
  tokens: OneArray = [];
  expression: string;
  operators: OneArray;

  constructor(expression: string, operators: OneArray) {
      this.expression = expression;
      this.operators = operators;
      if (!this.tryToReadNumber()) {
          this.tryToReadOperator();
          this.tryToReadLiteral();
      }
      
      while (this.hasMoreToken()) {
          if (!this.tryToReadOperator()) {
              this.fail("expected operator here");
          }
          
          if (!this.tryToReadLiteral()) {
              this.fail("expected literal here");
          }
      }
  }

  fail(message: string) {
    let endOffset = this.offset + 30;
    if (endOffset > this.expression.length) {
        endOffset = this.expression.length;
    }
    const context = this.expression.substring(this.offset, endOffset) + "...";
    throw new Error(`TokenizerException: ${message} at '${context}' (offset: ${this.offset})`);
  }
  
  hasMoreToken() {
    this.skipWhitespace();
    return !this.eof();
  }
  
  add(kind: TokenKind, value: string) {
    this.tokens.push(new Token(kind, value));
    this.offset += value.length;
  }
  
  tryToMatch(pattern: string) {
    const matches = one.Regex.matchFromIndex(pattern, this.expression, this.offset);
    return matches == null ? "" : matches[0];
  }
  
  tryToReadOperator() {
    this.skipWhitespace();
    for (const op of this.operators) {
        if (this.expression.startsWith(op, this.offset)) {
            this.add(TokenKind.Operator_, op);
            return true;
        }
    }
    return false;
  }
  
  tryToReadNumber() {
    this.skipWhitespace();
    
    const number = this.tryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
    if (number == "") {
        return false;
    }
    
    this.add(TokenKind.Number, number);
    
    if (this.tryToMatch("[0-9a-zA-Z]") != "") {
        this.fail("invalid character in number");
    }
    
    return true;
  }
  
  tryToReadIdentifier() {
    this.skipWhitespace();
    const identifier = this.tryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
    if (identifier == "") {
        return false;
    }
    
    this.add(TokenKind.Identifier, identifier);
    return true;
  }
  
  tryToReadString() {
    this.skipWhitespace();
    
    let match = this.tryToMatch("'(\\\\'|[^'])*'");
    if (match == "") {
        match = this.tryToMatch("\"(\\\\\"|[^\"])*\"");
    }
    if (match == "") {
        return false;
    }
    
    let str = match.substring(1, 1 + match.length - 2);
    str = match[0] == "'" ? str.split("\\'").join("'") : str.split("\\\"").join("\"");
    this.tokens.push(new Token(TokenKind.String_, str));
    this.offset += match.length;
    return true;
  }
  
  eof() {
    return this.offset >= this.expression.length;
  }
  
  skipWhitespace() {
    while (!this.eof()) {
        const c = this.expression[this.offset];
        if (c == " " || c == "\n" || c == "\t" || c == "\r") {
            this.offset++;
        } else {
            break
        }
    }
  }
  
  tryToReadLiteral() {
    const success = this.tryToReadIdentifier() || this.tryToReadNumber() || this.tryToReadString();
    return success;
  }
}

class TestClass {
  testMethod() {
    const lexer = new ExprLangLexer("1+2", ["+"]);
    let result = "";
    for (const token of lexer.tokens) {
        if (result != "") {
            result += ", ";
        }
        result += token.value;
    }
    
    console.log(`[${lexer.tokens.length}]: ${result}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}