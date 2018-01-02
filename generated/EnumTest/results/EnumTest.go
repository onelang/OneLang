package main

import "fmt"
type TestEnum int
const (
    TestEnum_ITEM1 = 0
    TestEnum_ITEM2 = 1
)

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    enumV := TestEnum_ITEM1
    if 3 * 2 == 6 {
        enumV = TestEnum_ITEM2
    }
    
    var tmp0 string
    if enumV == TestEnum_ITEM2 {
      tmp0 = "SUCCESS"
    } else {
      tmp0 = "FAIL"
    }
    check1 := tmp0
    var tmp1 string
    if enumV == TestEnum_ITEM1 {
      tmp1 = "FAIL"
    } else {
      tmp1 = "SUCCESS"
    }
    check2 := tmp1
    
    fmt.Println(fmt.Sprintf("Item1: %v, Item2: %v, checks: %v %v", TestEnum_ITEM1, enumV, check1, check2))
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