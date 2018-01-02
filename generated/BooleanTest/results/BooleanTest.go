package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    a := true
    b := false
    c := a && b
    d := a || b
    fmt.Println(fmt.Sprintf("a: %v, b: %v, c: %v, d: %v", a, b, c, d))
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