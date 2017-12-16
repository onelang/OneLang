class TokenKind {
  public static number: string = "number";
  public static identifier: string = "identifier";
  public static operatorX: string = "operator";
  public static stringX: string = "string";
}

class Token {
  public kind: string;
  public value: string;

  constructor(kind: string, value: string) {
      this.value = value;
      this.kind = kind;
  }
}

class ExprLangLexer {
  public offset: number = 0;
  public tokens: OneArray = [];
  public expression: string;
  public operators: OneArray;

  constructor(expression: string, operators: OneArray) {
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

  public fail(message: string) {
    const context = this.expression.substring(this.offset, this.offset + 30) + "...";
    throw new Error(`TokenizerException: ${message} at '${context}' (offset: ${this.offset})`);
  }
  
  public hasMoreToken() {
    this.skipWhitespace();
    return !this.eof();
  }
  
  public add(kind: string, value: string) {
    this.tokens.push(new Token(kind, value));
    this.offset += value.length;
  }
  
  public tryToMatch(pattern: string) {
    const matches = OneRegex.matchFromIndex(pattern, this.expression, this.offset);
    return matches[0];
  }
  
  public tryToReadOperator() {
    this.skipWhitespace();
    for (const op of this.operators) {
        if (this.expression.startsWith(op, this.offset)) {
            this.add(TokenKind.operatorX, op);
            return true;
        }
    }
    return false;
  }
  
  public tryToReadNumber() {
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
  
  public tryToReadIdentifier() {
    this.skipWhitespace();
    const identifier = this.tryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
    if (identifier == "") {
        return false;
    }
    
    this.add(TokenKind.identifier, identifier);
    return true;
  }
  
  public tryToReadString() {
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
  
  public eof() {
    return this.offset >= this.expression.length;
  }
  
  public skipWhitespace() {
    while (!this.eof()) {
        const c = this.expression[this.offset];
        if (c == " " || c == "\n" || c == "\t" || c == "\r") {
            this.offset++;
        } else {
            break
        }
    }
  }
  
  public tryToReadLiteral() {
    const success = this.tryToReadIdentifier() || this.tryToReadNumber() || this.tryToReadString();
    return success;
  }
}

class TestClass {
  public testMethod() {
    const lexer = new ExprLangLexer("1+2", ["+"]);
    console.log(`Token count: ${lexer.tokens.length}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}