package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) MethodTest(methodParam []string) {
}

func (this *TestClass) TestMethod() {
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