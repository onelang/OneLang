package main

import "fmt"
type MapTestClass struct {
}

func NewMapTestClass() *MapTestClass {
    this := new(MapTestClass)
    return this
}

func (this *MapTestClass) MapTest() {
    mapObj := map[string]int{
      "x": 5,
    }
    //let containsX = "x" in mapObj;
    //delete mapObj["x"];
    mapObj["x"] = 3
    return mapObj["x"]
}

func init() {
}