package main

type TestClass struct {
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    return this
}

func (this *TestClass) MethodTest(method_param []string) {
}

func (this *TestClass) TestMethod() {
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}