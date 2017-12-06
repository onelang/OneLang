package main

type TokenType struct {
    EndToken string
    Whitespace string
    Identifier string
    OperatorX string
    NoInitializer string
}

func NewTokenType() *TokenType {
    this := new(TokenType)
    return this
}

var TokenTypeEndToken string = "EndToken";
var TokenTypeWhitespace string = "Whitespace";
var TokenTypeIdentifier string = "Identifier";
var TokenTypeOperatorX string = "Operator";
var TokenTypeNoInitializer string;

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() string {
    casing_test := TokenTypeEndToken
    return casing_test
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}