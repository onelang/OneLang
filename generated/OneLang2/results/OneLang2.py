class TokenKind:
    pass

TokenKind.number = "number";
TokenKind.identifier = "identifier";
TokenKind.operator_x = "operator";
TokenKind.string_x = "string";

class Token:
    def __init__(self, kind, value):
        self.value = value
        self.kind = kind

class ExprLangLexer:
    def __init__(self, expression, operators):
        self.operators = operators
        self.expression = expression
        if !self.try_to_read_number():
            self.try_to_read_operator()
            self.try_to_read_literal()
        
        while self.has_more_token():
            if !self.try_to_read_operator():
                self.fail("expected operator here")
            self.try_to_read_literal()

    def fail(self, message):
        context = self.expression[self.offset:self.offset + 30] + "..."
        raise Exception("TokenizerException: %s at '%s' (offset: %s)" % (message, context, self.offset, ))
    
    def has_more_token(self):
        self.skip_whitespace()
        return !self.eof()
    
    def add(self, kind, value):
        self.tokens.append(Token(kind, value))
        self.offset += len(value)
    
    def try_to_match(self, pattern):
        matches = OneRegex.match_from_index(pattern, self.expression, self.offset)
        return matches[0]
    
    def try_to_read_operator(self):
        self.skip_whitespace()
        for op in self.operators:
            if self.expression.startswith(op, self.offset):
                self.add(TokenKind.operator_x, op)
                return True
        return False
    
    def try_to_read_number(self):
        self.skip_whitespace()
        number = self.try_to_match("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)")
        if number == "":
            return False
        
        self.add(TokenKind.number, number)
        if self.try_to_match("[0-9a-zA-Z]"):
            self.fail("invalid character in number")
        
        return True
    
    def try_to_read_identifier(self):
        self.skip_whitespace()
        identifier = self.try_to_match("[a-zA-Z_][a-zA-Z0-9_]*")
        if identifier == "":
            return False
        
        self.add(TokenKind.identifier, identifier)
        return True
    
    def try_to_read_string(self):
        self.skip_whitespace()
        
        match = self.try_to_match("\'(\\\\\'|[^\'])*\'")
        if match == None:
            match = self.try_to_match("\"(\\\\\"|[^\"])*\"")
        if match == None:
            return False
        
        str = match[1:1 + len(match) - 2]
        str = str.replace("\\\'", "\'") if match[0] == "\'" else str.replace("\\\"", "\"")
        self.tokens.append(Token(TokenKind.string_x, str))
        self.offset += len(match)
        return True
    
    def eof(self):
        return self.offset >= len(self.expression)
    
    def skip_whitespace(self):
        while !self.eof():
            c = self.expression[self.offset]
            if c == " " or c == "\n" or c == "\t" or c == "\r":
                self.offset += 1
            else:
                break
    
    def try_to_read_literal(self):
        success = self.try_to_read_identifier() or self.try_to_read_number() or self.try_to_read_string()
        return success

class TestClass:
    def test_method(self):
        lexer = ExprLangLexer("1+2", ["+"])
        print "Token count: %s" % (len(lexer.tokens), )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message