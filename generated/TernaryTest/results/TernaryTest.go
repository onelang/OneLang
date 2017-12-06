package main

import "fmt"

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) GetResult() bool {
    return true
}

func (this *TestClass) TestMethod() {
    var tmp0 string
    if this.GetResult() {
      tmp0 = "true"
    } else {
      tmp0 = "false"
    }
    fmt.Println(tmp0)
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}