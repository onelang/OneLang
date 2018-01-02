package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) MapTest() int {
    map_obj := map[string]int{
      "x": 5,
      "y": 3,
    }
    
    //let containsX = "x" in mapObj;
    map_obj["z"] = 9
    delete(map_obj, "x")
    
    keys_var := make([]string, 0, len(map_obj))
    for  key, _ := range map_obj {
      keys_var = append(keys_var, key)
    }
    values_var := make([]int, 0, len(map_obj))
    for  _, value := range map_obj {
      values_var = append(values_var, value)
    }
    return map_obj["z"]
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
    
    mutable_arr := []int{1, 2}
    mutable_arr = append(mutable_arr, 3)
    mutable_arr = append(mutable_arr, 4)
    // mutableArr.push(c2.property);
    // mutableArr.push(c2.child.property);
    // mutableArr.push(c2.child.child.property);
    
    constant_arr := []int{5, 6}
    
    // some comment
    //   some comment line 2
    for _, item := range mutable_arr {
        fmt.Println(item)
    }
    
    /* some other comment
       multiline and stuff
    */
    for i := 0; i < len(constant_arr); i++ {
        fmt.Println(constant_arr[i])
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