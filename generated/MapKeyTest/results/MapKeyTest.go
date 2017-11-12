package main

type TestClass struct {
    
}

func NewTestClass() *TestClass {
    this := new(TestClass)
    
    return this
}

func (this *TestClass) TestMethod()  {
    map := map[string]{
      
    }
    keys := make([]string, 0, len(map))
    for  key, _ := range map {
      keys = append(keys, key)
    }
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}