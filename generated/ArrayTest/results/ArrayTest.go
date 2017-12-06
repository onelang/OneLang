package main

type ArrayTestClass struct {
}

func NewArrayTestClass() *ArrayTestClass {
    this := new(ArrayTestClass)
    return this
}

func (this *ArrayTestClass) ArrayTest() {
    constant_arr := []int{5}
    return len(constant_arr)
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}