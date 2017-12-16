class TokenType:
    pass

TokenType.end_token = "EndToken";
TokenType.whitespace = "Whitespace";
TokenType.identifier = "Identifier";
TokenType.operator_x = "Operator";

class TestClass:
    def test_method(self):
        casing_test = TokenType.end_token
        return casing_test

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message