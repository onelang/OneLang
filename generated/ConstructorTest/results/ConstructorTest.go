package main

import "fmt"

type ConstructorTest struct {
    Field2 int
    Field1 int
}

func NewConstructorTest(field1 int) *ConstructorTest {
    this := new(ConstructorTest)
    this.Field1 = field1
    this.Field2 = field1 * this.Field1 * 5
    return this
}

var ConstructorTestField2 int;
var ConstructorTestField1 int;

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    test := NewConstructorTest(3)
    fmt.Println(test.Field2)
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}