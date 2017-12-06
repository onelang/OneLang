package main

type MapX struct {
}

func NewMapX() *MapX {
    this := new(MapX)
    return this
}

func (this *MapX) Set(key , value ) {
}

func (this *MapX) Get(key ) {
    return nil
}

type Main struct {
}

func NewMain() *Main {
    this := new(Main)
    return this
}

func (this *Main) Test() {
    map := NewMapX()
    map.Set("hello", 3)
    num_value := map.Get("hello2")
}

func main() {
    c := (TestClass{})
    c.TestMethod();
}