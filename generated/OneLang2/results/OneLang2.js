class TokenKind {
}

TokenKind.number = "number";
TokenKind.identifier = "identifier";
TokenKind.operatorX = "operator";
TokenKind.stringX = "string";

class Token {
  constructor(kind, value) {
      this.value = value;
      this.kind = kind;
  }
}

class ExprLangLexer {
  constructor(expression, operators) {
      this.operators = operators;
      this.expression = expression;
      if (!this.tryToReadNumber()) {
          this.tryToReadOperator();
          this.tryToReadLiteral();
      }
      
      while (this.hasMoreToken()) {
          if (!this.tryToReadOperator()) {
              this.fail("expected operator here");
          }
          
          this.tryToReadLiteral();
      }
  }

  fail(message) {
    const context = this.expression.substring(this.offset, this.offset + 30) + "...";
    throw new Error(`TokenizerException: ${message} at '${context}' (offset: ${this.offset})`);
  }
  
  hasMoreToken() {
    this.skipWhitespace();
    return !this.eof();
  }
  
  add(kind, value) {
    this.tokens.push(new Token(kind, value));
    this.offset += value.length;
  }
  
  tryToMatch(pattern) {
    const matches = OneRegex.matchFromIndex(pattern, this.expression, this.offset);
    return matches[0];
  }
  
  tryToReadOperator() {
    this.skipWhitespace();
    for (const op of this.operators) {
        if (this.expression.startsWith(op, this.offset)) {
            this.add(TokenKind.operatorX, op);
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
    
    this.add(TokenKind.number, number);
    if (this.tryToMatch("[0-9a-zA-Z]")) {
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
    
    this.add(TokenKind.identifier, identifier);
    return true;
  }
  
  tryToReadString() {
    this.skipWhitespace();
    
    let match = this.tryToMatch("\'(\\\\\'|[^\'])*\'");
    if (match == null) {
        match = this.tryToMatch("\"(\\\\\"|[^\"])*\"");
    }
    if (match == null) {
        return false;
    }
    
    let str = match.substring(1, 1 + match.length - 2);
    str = match[0] == "\'" ? str.split("\\\'").join("\'") : str.split("\\\"").join("\"");
    this.tokens.push(new Token(TokenKind.stringX, str));
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
    console.log(`Token count: ${lexer.tokens.length}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}