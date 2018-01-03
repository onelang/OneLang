class TokenType:
    pass

TokenType.end_token = "EndToken";
TokenType.whitespace = "Whitespace";
TokenType.identifier = "Identifier";
TokenType.operator_x = "Operator";

class Token:
    def __init__(self, value, is_operator):
        self.value = value
        self.is_operator = is_operator

class StringHelper:
    @staticmethod
    def starts_with_at_index(str, substr, idx):
        return str[idx:idx + len(substr)] == substr

class Tokenizer:
    def __init__(self, text, operators):
        self.text = text
        self.operators = operators
        self.offset = 0

    def get_token_type(self):
        if self.offset >= len(self.text):
            return TokenType.end_token
        
        c = self.text[self.offset]
        return TokenType.whitespace if c == " " or c == "\n" or c == "\t" or c == "\r" else TokenType.identifier if ("A" <= c and c <= "Z") or ("a" <= c and c <= "z") or ("0" <= c and c <= "9") or c == "_" else TokenType.operator_x
    
    def tokenize(self):
        result = []
        
        while self.offset < len(self.text):
            char_type = self.get_token_type()
            if char_type == TokenType.whitespace:
                while self.get_token_type() == TokenType.whitespace:
                    self.offset += 1
            elif char_type == TokenType.identifier:
                start_offset = self.offset
                while self.get_token_type() == TokenType.identifier:
                    self.offset += 1
                identifier = self.text[start_offset:self.offset]
                result.append(Token(identifier, False))
            else:
                op = ""
                for curr_op in self.operators:
                    if StringHelper.starts_with_at_index(self.text, curr_op, self.offset):
                        op = curr_op
                        break
                if op == "":
                    break
                self.offset += len(op)
                result.append(Token(op, True))
        
        return result

class TestClass:
    def test_method(self):
        operators = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."]
        
        input = "hello * 5"
        tokenizer = Tokenizer(input, operators)
        result = tokenizer.tokenize()
        
        print "token count:"
        print len(result)
        for item in result:
            print item.value + "(" + ("op" if item.is_operator else "id") + ")"

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message