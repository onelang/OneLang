package main

type List struct {
    Items *[]
}

func NewList() *List {
    this := new(List)
    return this
}

var ListItems [];

type Item struct {
    Offset int
    StrTest string
    StrConstr string
}

func NewItem(str_constr string) *Item {
    this := new(Item)
    this.StrConstr = str_constr
    return this
}

var ItemOffset int = 5;
var ItemStrTest string = "test" + "test2";
var ItemStrConstr string = "constr";

type Container struct {
    ItemList *List
    StringList *List
}

func NewContainer() *Container {
    this := new(Container)
    return this
}

func (this *Container) Method0() {
}

func (this *Container) Method1(str string) {
    return str
}

var ContainerItemList List;
var ContainerStringList List;

func main() {
    c := (TestClass{})
    c.TestMethod();
}