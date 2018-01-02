package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) MapTest() int {
    mapObj := map[string]int{
      "x": 5,
      "y": 3,
    }
    
    //let containsX = "x" in mapObj;
    mapObj["z"] = 9
    delete(mapObj, "x")
    
    keysVar := make([]string, 0, len(mapObj))
    for  key, _ := range mapObj {
      keysVar = append(keysVar, key)
    }
    valuesVar := make([]int, 0, len(mapObj))
    for  _, value := range mapObj {
      valuesVar = append(valuesVar, value)
    }
    return mapObj["z"]
}

func (this *TestClass) ExplicitTypeTest() {
    op := ""
    fmt.Println(len(op))
}

func (this *TestClass) IfTest(x int) string {
    result := "<unk>"
    
    if x > 3 {
        result = "hello"
    } else if x < 1 {
        result = "bello"
    } else if x < 0 {
        result = "bello2"
    } else {
        result = "???"
    }
    
    if x > 3 {
        result = "z"
    }
    
    if x > 3 {
        result = "x"
    } else {
        result = "y"
    }
    
    return result
}

func (this *TestClass) ArrayTest() {
    //const c2 = new Class2();
    
    mutableArr := []int{1, 2}
    mutableArr = append(mutableArr, 3)
    mutableArr = append(mutableArr, 4)
    // mutableArr.push(c2.property);
    // mutableArr.push(c2.child.property);
    // mutableArr.push(c2.child.child.property);
    
    constantArr := []int{5, 6}
    
    // some comment
    //   some comment line 2
    for _, item := range mutableArr {
        fmt.Println(item)
    }
    
    /* some other comment
       multiline and stuff
    */
    for i := 0; i < len(constantArr); i++ {
        fmt.Println(constantArr[i])
    }
}

func (this *TestClass) Calc() int {
    return (1 + 2) * 3
}

func (this *TestClass) MethodWithArgs(arg1 int, arg2 int, arg3 int) int {
    stuff := arg1 + arg2 + arg3 * this.Calc()
    return stuff
}

func (this *TestClass) StringTest() string {
    x := "x"
    y := "y"
    
    z := "z"
    z += "Z"
    z += x
    
    return z + "|" + x + y
}

func (this *TestClass) ReverseString(str string) string {
    result := ""
    for i := len(str) - 1; i >= 0; i-- {
        result += string(str[i])
    }
    return result
}

func (this *TestClass) GetBoolResult(value bool) bool {
    return value
}

func (this *TestClass) TestMethod() {
    this.ArrayTest()
    fmt.Println(this.MapTest())
    fmt.Println(this.StringTest())
    fmt.Println(this.ReverseString("print value"))
    var tmp0 string
    if this.GetBoolResult(true) {
      tmp0 = "true"
    } else {
      tmp0 = "false"
    }
    fmt.Println(tmp0)
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