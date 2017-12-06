package main

type MapTestClass struct {
}

func NewMapTestClass() *MapTestClass {
    this := new(MapTestClass)
    return this
}

func (this *MapTestClass) MapTest() {
    map_obj := map[string]int{
      "x": 5,
    }
    //let containsX = "x" in mapObj;
    //delete mapObj["x"];
    map_obj["x"] = 3
    return map_obj["x"]
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}