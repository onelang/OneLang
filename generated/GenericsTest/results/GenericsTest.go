package main

import "fmt"
type MapX struct {
    Value interface{}
}

func NewMapX() *MapX {
    this := new(MapX)
    return this
}

func (this *MapX) Set(key interface{}, value interface{}) {
    this.Value = value
}

func (this *MapX) Get(key interface{}) interface{} {
    return this.Value
}

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() {
    mapX := NewMapX()
    mapX.Set("hello", 3)
    numValue := mapX.Get("hello2")
    fmt.Println(fmt.Sprintf("%v", numValue))
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