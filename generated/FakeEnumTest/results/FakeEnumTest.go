package main

import "fmt"
type TokenType struct {
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
    casingTest := TokenTypeEndToken
    return casingTest
}

func init() {
}

func main() {
    defer func() {
      if r := recover(); r != nil {
          fmt.Print("Exception: ", r)
      }
    }()

    c := NewTestClass()
    c.TestMethod();
}