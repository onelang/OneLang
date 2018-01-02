package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    constantArr := []int{5}
    
    mutableArr := []int{1}
    mutableArr = append(mutableArr, 2)
    
    fmt.Println(fmt.Sprintf("len1: %v, len2: %v", len(constantArr), len(mutableArr)))
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