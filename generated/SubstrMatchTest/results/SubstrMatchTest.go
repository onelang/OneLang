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
    t_a0_true := str[0:0 + len("A")] == "A"
    t_a1_false := str[1:1 + len("A")] == "A"
    t_b1_true := str[1:1 + len("B")] == "B"
    t_c_d2_true := str[2:2 + len("CD")] == "CD"
    fmt.Println(fmt.Sprintf("%v %v %v %v", t_a0_true, t_a1_false, t_b1_true, t_c_d2_true))
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