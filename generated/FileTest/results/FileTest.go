package main

import "fmt"
import "io/ioutil"

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) TestMethod() string {
    file_content_bytes, _ := ioutil.ReadFile("../../input/test.txt")
    fileContent := string(file_content_bytes)
    return fileContent
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