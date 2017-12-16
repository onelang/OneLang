package main

import "fmt"
type TokenType struct {
    EndToken string
    Whitespace string
    Identifier string
    OperatorX string
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

func NewToken(value string, is_operator bool) *Token {
    this := new(Token)
    this.IsOperator = is_operator
    this.Value = value
    return this
}

var TokenValue string;
var TokenIsOperator bool;

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
    this.Operators = operators
    this.Text = text
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
        char_type := this.GetTokenType()
        
        if char_type == TokenTypeWhitespace {
            for this.GetTokenType() == TokenTypeWhitespace {
                this.Offset++
            }
        } else if char_type == TokenTypeIdentifier {
            start_offset := this.Offset
            for this.GetTokenType() == TokenTypeIdentifier {
                this.Offset++
            }
            identifier := this.Text[start_offset:this.Offset]
            result = append(result, NewToken(identifier, false))
        } else {
            op := ""
            for _, curr_op := range this.Operators {
                if StringHelper_StartsWithAtIndex(this.Text, curr_op, this.Offset) {
                    op = curr_op
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

var TokenizerOffset int;
var TokenizerText string;
var TokenizerOperators []string;

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

func main() {
    defer func() {
      if r := recover(); r != nil {
          fmt.Print("Exception: ", r)
      }
    }()

    c := (TestClass{})
    c.TestMethod();
}