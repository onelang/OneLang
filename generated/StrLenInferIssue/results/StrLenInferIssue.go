package main

type StrLenInferIssue struct {
    
}

func NewStrLenInferIssue() *StrLenInferIssue {
    this := new(StrLenInferIssue)
    
    return this
}

func (this *StrLenInferIssue) Test(str string) int {
    return len(str)
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}