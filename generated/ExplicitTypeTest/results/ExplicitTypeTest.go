package main

import "fmt"

type TestClass struct {
    
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    
    return this
}

func (this *TestClass) TestMethod()  {
    op := nil
    fmt.Println(len(op))
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}