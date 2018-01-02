package main

import "fmt"
type SomeKind int
const (
    SomeKind_ENUM_VAL0 = 0
    SomeKind_ENUM_VAL1 = 1
    SomeKind_ENUM_VAL2 = 2
)

type TestClass struct {
    EnumField SomeKind
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    this.EnumField = SomeKind_ENUM_VAL2
    return this
}

func (this *TestClass) TestMethod() {
    fmt.Println(fmt.Sprintf("Value: %v", this.EnumField))
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