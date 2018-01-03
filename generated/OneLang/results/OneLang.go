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

type Token struct {
    Value string
    IsOperator bool
}

func NewToken(value string, isOperator bool) *Token {
    this := new(Token)
    this.Value = value
    this.IsOperator = isOperator
    return this
}

type StringHelper struct {
}

func NewStringHelper() *StringHelper {
    this := new(StringHelper)
    return this
}

func StringHelper_StartsWithAtIndex(str string, substr string, idx int) bool {
    return str[idx:idx + len(substr)] == substr
}

type Tokenizer struct {
    Offset int
    Text string
    Operators []string
}

func NewTokenizer(text string, operators []string) *Tokenizer {
    this := new(Tokenizer)
    this.Text = text
    this.Operators = operators
    this.Offset = 0
    return this
}

func (this *Tokenizer) GetTokenType() string {
    if this.Offset >= len(this.Text) {
        return TokenTypeEndToken
    }
    
    c := this.Text[this.Offset]
    var tmp1 string
    if ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' {
      tmp1 = TokenTypeIdentifier
    } else {
      tmp1 = TokenTypeOperatorX
    }
    var tmp0 string
    if c == ' ' || c == '\n' || c == '\t' || c == '\r' {
      tmp0 = TokenTypeWhitespace
    } else {
      tmp0 = tmp1
    }
    return tmp0
}

func (this *Tokenizer) Tokenize() []*Token {
    result := []*Token{}
    
    for this.Offset < len(this.Text) {
        charType := this.GetTokenType()
        
        if charType == TokenTypeWhitespace {
            for this.GetTokenType() == TokenTypeWhitespace {
                this.Offset++
            }
        } else if charType == TokenTypeIdentifier {
            startOffset := this.Offset
            for this.GetTokenType() == TokenTypeIdentifier {
                this.Offset++
            }
            identifier := this.Text[startOffset:this.Offset]
            result = append(result, NewToken(identifier, false))
        } else {
            op := ""
            for _, currOp := range this.Operators {
                if StringHelper_StartsWithAtIndex(this.Text, currOp, this.Offset) {
                    op = currOp
                    break
                }
            }
            
            if op == "" {
                break
            }
            
            this.Offset += len(op)
            result = append(result, NewToken(op, true))
        }
    }
    
    return result
}

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    operators := []string{"<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."}
    
    input := "hello * 5"
    tokenizer := NewTokenizer(input, operators)
    result := tokenizer.Tokenize()
    
    fmt.Println("token count:")
    fmt.Println(len(result))
    for _, item := range result {
        var tmp2 string
        if item.IsOperator {
          tmp2 = "op"
        } else {
          tmp2 = "id"
        }
        fmt.Println(item.Value + "(" + (tmp2) + ")")
    }
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