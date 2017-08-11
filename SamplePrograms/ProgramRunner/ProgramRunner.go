package main

import "fmt"

type testClass struct {
}

func (this *testClass) testMethod() {
    fmt.Println("Hello World!")
}

func main() {
    c := (testClass{})
    c.testMethod()
}
