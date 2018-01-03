package main

import "fmt"
import "one"
import "strings"

type TokenKind int
const (
    TokenKind_NUMBER = 0
    TokenKind_IDENTIFIER = 1
    TokenKind_OPERATOR_ = 2
    TokenKind_STRING_ = 3
)

type Token struct {
    Kind TokenKind
    Value string
}

func NewToken(kind TokenKind, value string) *Token {
    this := new(Token)
    this.Kind = kind
    this.Value = value
    return this
}

type ExprLangLexer struct {
    Offset int
    Tokens []*Token
    Expression string
    Operators []string
}

func NewExprLangLexer(expression string, operators []string) *ExprLangLexer {
    this := new(ExprLangLexer)
    this.Offset = 0
    this.Tokens = []*Token{}
    this.Expression = expression
    this.Operators = operators
    if !this.TryToReadNumber() {
        this.TryToReadOperator()
        this.TryToReadLiteral()
    }
    
    for this.HasMoreToken() {
        if !this.TryToReadOperator() {
            this.Fail("expected operator here")
        }
        
        if !this.TryToReadLiteral() {
            this.Fail("expected literal here")
        }
    }
    return this
}

func (this *ExprLangLexer) Fail(message string) {
    endOffset := this.Offset + 30
    if endOffset > len(this.Expression) {
        endOffset = len(this.Expression)
    }
    context := this.Expression[this.Offset:endOffset] + "..."
    panic(fmt.Sprintf("TokenizerException: %v at '%v' (offset: %v)", message, context, this.Offset))
}

func (this *ExprLangLexer) HasMoreToken() bool {
    this.SkipWhitespace()
    return !this.Eof()
}

func (this *ExprLangLexer) Add(kind TokenKind, value string) {
    this.Tokens = append(this.Tokens, NewToken(kind, value))
    this.Offset += len(value)
}

func (this *ExprLangLexer) TryToMatch(pattern string) string {
    matches := one.Regex_MatchFromIndex(pattern, this.Expression, this.Offset)
    var tmp0 string
    if matches == nil {
      tmp0 = ""
    } else {
      tmp0 = matches[0]
    }
    return tmp0
}

func (this *ExprLangLexer) TryToReadOperator() bool {
    this.SkipWhitespace()
    for _, op := range this.Operators {
        if this.Expression[this.Offset:this.Offset + len(op)] == op {
            this.Add(TokenKind_OPERATOR_, op)
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
    
    this.Add(TokenKind_NUMBER, number)
    
    if this.TryToMatch("[0-9a-zA-Z]") != "" {
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
    
    this.Add(TokenKind_IDENTIFIER, identifier)
    return true
}

func (this *ExprLangLexer) TryToReadString() bool {
    this.SkipWhitespace()
    
    match := this.TryToMatch("'(\\\\'|[^'])*'")
    if match == "" {
        match = this.TryToMatch("\"(\\\\\"|[^\"])*\"")
    }
    if match == "" {
        return false
    }
    
    str := match[1:1 + len(match) - 2]
    var tmp1 string
    if match[0] == '\'' {
      tmp1 = strings.Replace(str, "\\'", "'", -1)
    } else {
      tmp1 = strings.Replace(str, "\\\"", "\"", -1)
    }
    str = tmp1
    this.Tokens = append(this.Tokens, NewToken(TokenKind_STRING_, str))
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
    result := ""
    for _, token := range lexer.Tokens {
        if result != "" {
            result += ", "
        }
        result += token.Value
    }
    
    fmt.Println(fmt.Sprintf("[%v]: %v", len(lexer.Tokens), result))
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