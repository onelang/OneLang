package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    str := "a1A"
    for i := 0; i < len(str); i++ {
        c := str[i]
        is_upper := 'A' <= c && c <= 'Z'
        is_lower := 'a' <= c && c <= 'z'
        is_number := '0' <= c && c <= '9'
        var tmp2 string
        if is_number {
          tmp2 = "number"
        } else {
          tmp2 = "other"
        }
        var tmp1 string
        if is_lower {
          tmp1 = "lower"
        } else {
          tmp1 = tmp2
        }
        var tmp0 string
        if is_upper {
          tmp0 = "upper"
        } else {
          tmp0 = tmp1
        }
        fmt.Println(tmp0)
    }
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