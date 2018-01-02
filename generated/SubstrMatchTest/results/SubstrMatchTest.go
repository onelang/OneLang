package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    str := "ABCDEF"
    tA0True := str[0:0 + len("A")] == "A"
    tA1False := str[1:1 + len("A")] == "A"
    tB1True := str[1:1 + len("B")] == "B"
    tCD2True := str[2:2 + len("CD")] == "CD"
    fmt.Println(fmt.Sprintf("%v %v %v %v", tA0True, tA1False, tB1True, tCD2True))
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