package main

import "fmt"
type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    result := []string{}
    map := map[string]int{
      "x": 5,
    }
    keys := make([]string, 0, len(map))
    for  key, _ := range map {
      keys = append(keys, key)
    }
    fmt.Println(result)
    fmt.Println(keys)
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}