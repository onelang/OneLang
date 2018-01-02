package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) ReverseString(str string) string {
    result := ""
    for i := len(str) - 1; i >= 0; i-- {
        result += string(str[i])
    }
    return result
}

func (this *TestClass) TestMethod() string {
    fmt.Println(this.ReverseString("print value"))
    return "return value"
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