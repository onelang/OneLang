package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    constant_arr := []int{5}
    
    mutable_arr := []int{1}
    mutable_arr = append(mutable_arr, 2)
    
    fmt.Println(fmt.Sprintf("len1: %v, len2: %v", len(constant_arr), len(mutable_arr)))
}

func main() {
    defer func() {
      if r := recover(); r != nil {
          fmt.Print("Exception: ", r)
      }
    }()

    c := (TestClass{})
    c.TestMethod();
}