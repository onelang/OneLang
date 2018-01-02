package main

import "fmt"
import "strconv"

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    strVal := "str"
    num := 1337
    b := true
    result := fmt.Sprintf("before %v, num: %v, true: %v after", strVal, num, b)
    fmt.Println(result)
    fmt.Println(fmt.Sprintf("before %v, num: %v, true: %v after", strVal, num, b))
    
    result2 := "before " + strVal + ", num: " + strconv.Itoa(num) + ", true: " + strconv.FormatBool(b) + " after"
    fmt.Println(result2)
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