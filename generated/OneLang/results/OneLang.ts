class TokenType {
  public static endToken: string = "EndToken";
  public static whitespace: string = "Whitespace";
  public static identifier: string = "Identifier";
  public static operatorX: string = "Operator";
}

class Token {
  public value: string;
  public isOperator: bool;

  constructor(value: string, is_operator: bool) {
      this.isOperator = is_operator;
      this.value = value;
  }
}

class StringHelper {
  public static startsWithAtIndex(str: string, substr: string, idx: number) {
    return str.substring(idx, idx + substr.length) == substr;
  }
}

class Tokenizer {
  public offset: number;
  public text: string;
  public operators: OneArray;

  constructor(text: string, operators: OneArray) {
      this.operators = operators;
      this.text = text;
      this.offset = 0;
  }

  public getTokenType() {
    if (this.offset >= this.text.length) {
        return TokenType.endToken;
    }
    
    const c = this.text[this.offset];
    return c == " " || c == "\n" || c == "\t" || c == "\r" ? TokenType.whitespace : ("A" <= c && c <= "Z") || ("a" <= c && c <= "z") || ("0" <= c && c <= "9") || c == "_" ? TokenType.identifier : TokenType.operatorX;
  }
  
  public tokenize() {
    const result = [];
    
    while (this.offset < this.text.length) {
        const char_type = this.getTokenType();
        
        if (char_type == TokenType.whitespace) {
            while (this.getTokenType() == TokenType.whitespace) {
                this.offset++;
            }
        } else if (char_type == TokenType.identifier) {
            const start_offset = this.offset;
            while (this.getTokenType() == TokenType.identifier) {
                this.offset++;
            }
            const identifier = this.text.substring(start_offset, this.offset);
            result.push(new Token(identifier, false));
        } else {
            let op = "";
            for (const curr_op of this.operators) {
                if (StringHelper.startsWithAtIndex(this.text, curr_op, this.offset)) {
                    op = curr_op;
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
  public testMethod() {
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