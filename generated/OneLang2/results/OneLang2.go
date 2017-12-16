package main

import "fmt"
import "strings"

type TokenKind struct {
}

func NewTokenKind() *TokenKind {
    this := new(TokenKind)
    return this
}

var TokenKindNumber string = "number";
var TokenKindIdentifier string = "identifier";
var TokenKindOperatorX string = "operator";
var TokenKindStringX string = "string";

type Token struct {
    Kind string
    Value string
}

func NewToken(kind string, value string) *Token {
    this := new(Token)
    this.Value = value
    this.Kind = kind
    return this
}

type ExprLangLexer struct {
    Offset int = 0
    Tokens []*Token = []*Token{}
    Expression string
    Operators []string
}

func NewExprLangLexer(expression string, operators []string) *ExprLangLexer {
    this := new(ExprLangLexer)
    this.Operators = operators
    this.Expression = expression
    if !this.TryToReadNumber() {
        this.TryToReadOperator()
        this.TryToReadLiteral()
    }
    
    for this.HasMoreToken() {
        if !this.TryToReadOperator() {
            this.Fail("expected operator here")
        }
        
        this.TryToReadLiteral()
    }
    return this
}

func (this *ExprLangLexer) Fail(message string) {
    context := this.Expression[this.Offset:this.Offset + 30] + "..."
    panic(fmt.Sprintf("TokenizerException: %v at '%v' (offset: %v)", message, context, this.Offset))
}

func (this *ExprLangLexer) HasMoreToken() bool {
    this.SkipWhitespace()
    return !this.Eof()
}

func (this *ExprLangLexer) Add(kind string, value string) {
    this.Tokens = append(this.Tokens, NewToken(kind, value))
    this.Offset += len(value)
}

func (this *ExprLangLexer) TryToMatch(pattern string) string {
    matches := _(pattern, this.Expression, this.Offset)
    return matches[0]
}

func (this *ExprLangLexer) TryToReadOperator() bool {
    this.SkipWhitespace()
    for _, op := range this.Operators {
        if this.Expression[this.Offset:this.Offset + len(op)] == op {
            this.Add(TokenKindOperatorX, op)
            return true
        }
    }
    return false
}

func (this *ExprLangLexer) TryToReadNumber() bool {
    this.SkipWhitespace()
    number := this.TryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)")
    if number == "" {
        return false
    }
    
    this.Add(TokenKindNumber, number)
    if this.TryToMatch("[0-9a-zA-Z]") {
        this.Fail("invalid character in number")
    }
    
    return true
}

func (this *ExprLangLexer) TryToReadIdentifier() bool {
    this.SkipWhitespace()
    identifier := this.TryToMatch("[a-zA-Z_][a-zA-Z0-9_]*")
    if identifier == "" {
        return false
    }
    
    this.Add(TokenKindIdentifier, identifier)
    return true
}

func (this *ExprLangLexer) TryToReadString() bool {
    this.SkipWhitespace()
    
    match := this.TryToMatch("\'(\\\\\'|[^\'])*\'")
    if match == nil {
        match = this.TryToMatch("\"(\\\\\"|[^\"])*\"")
    }
    if match == nil {
        return false
    }
    
    str := match[1:1 + len(match) - 2]
    var tmp0 string
    if match[0] == '\'' {
      tmp0 = strings.Replace(str, "\\\'", "\'", -1)
    } else {
      tmp0 = strings.Replace(str, "\\\"", "\"", -1)
    }
    str = tmp0
    this.Tokens = append(this.Tokens, NewToken(TokenKindStringX, str))
    this.Offset += len(match)
    return true
}

func (this *ExprLangLexer) Eof() bool {
    return this.Offset >= len(this.Expression)
}

func (this *ExprLangLexer) SkipWhitespace() {
    for !this.Eof() {
        c := this.Expression[this.Offset]
        if c == ' ' || c == '\n' || c == '\t' || c == '\r' {
            this.Offset++
        } else {
            break
        }
    }
}

func (this *ExprLangLexer) TryToReadLiteral() bool {
    success := this.TryToReadIdentifier() || this.TryToReadNumber() || this.TryToReadString()
    return success
}

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    lexer := NewExprLangLexer("1+2", []string{"+"})
    fmt.Println(fmt.Sprintf("Token count: %v", len(lexer.Tokens)))
}

func main() {
    defer func() {
      if r := recover(); r != nil {
          fmt.Print("Exception: ", r)
      }
    }()

    c := (TestClass{})
    c.TestMethod();
}