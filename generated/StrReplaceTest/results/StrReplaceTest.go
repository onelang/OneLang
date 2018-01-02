package main

import "fmt"
import "strings"

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    str := "A x B x C x D"
    result := strings.Replace(str, "x", "y", -1)
    fmt.Println(fmt.Sprintf("R: %v, O: %v", result, str))
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