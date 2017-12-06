package main

import "fmt"

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    fmt.Println("Hello world!")
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}