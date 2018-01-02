package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) NotThrows() int {
    return 5
}

func (this *TestClass) FThrows() {
    panic("exception message")
}

func (this *TestClass) TestMethod() {
    fmt.Println(this.NotThrows())
    this.FThrows()
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