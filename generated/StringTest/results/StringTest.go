package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() string {
    x := "x"
    y := "y"
    
    z := "z"
    z += "Z"
    z += x
    
    a := "abcdef"[2:4]
    arr := strings.Split("ab  cd ef", " ")
    
    return z + "|" + x + y + "|" + a + "|" + arr[2]
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