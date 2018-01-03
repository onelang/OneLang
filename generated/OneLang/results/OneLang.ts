class TokenType {
  static endToken: string = "EndToken";
  static whitespace: string = "Whitespace";
  static identifier: string = "Identifier";
  static operatorX: string = "Operator";
}

class Token {
  value: string;
  isOperator: bool;

  constructor(value: string, isOperator: bool) {
      this.value = value;
      this.isOperator = isOperator;
  }
}

class StringHelper {
  static startsWithAtIndex(str: string, substr: string, idx: number) {
    return str.substring(idx, idx + substr.length) == substr;
  }
}

class Tokenizer {
  offset: number;
  text: string;
  operators: OneArray;

  constructor(text: string, operators: OneArray) {
      this.text = text;
      this.operators = operators;
      this.offset = 0;
  }

  getTokenType() {
    if (this.offset >= this.text.length) {
        return TokenType.endToken;
    }
    
    const c = this.text[this.offset];
    return c == " " || c == "\n" || c == "\t" || c == "\r" ? TokenType.whitespace : ("A" <= c && c <= "Z") || ("a" <= c && c <= "z") || ("0" <= c && c <= "9") || c == "_" ? TokenType.identifier : TokenType.operatorX;
  }
  
  tokenize() {
    const result = [];
    
    while (this.offset < this.text.length) {
        const charType = this.getTokenType();
        
        if (charType == TokenType.whitespace) {
            while (this.getTokenType() == TokenType.whitespace) {
                this.offset++;
            }
        } else if (charType == TokenType.identifier) {
            const startOffset = this.offset;
            while (this.getTokenType() == TokenType.identifier) {
                this.offset++;
            }
            const identifier = this.text.substring(startOffset, this.offset);
            result.push(new Token(identifier, false));
        } else {
            let op = "";
            for (const currOp of this.operators) {
                if (StringHelper.startsWithAtIndex(this.text, currOp, this.offset)) {
                    op = currOp;
                    break
                }
            }
            
            if (op == "") {
                break
            }
            
            this.offset += op.length;
            result.push(new Token(op, true));
        }
    }
    
    return result;
  }
}

class TestClass {
  testMethod() {
    const operators = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."];
    
    const input = "hello * 5";
    const tokenizer = new Tokenizer(input, operators);
    const result = tokenizer.tokenize();
    
    console.log("token count:");
    console.log(result.length);
    for (const item of result) {
        console.log(item.value + "(" + (item.isOperator ? "op" : "id") + ")");
    }
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}