package main

import "fmt"
type List struct {
    Items []
}

func NewList() *List {
    this := new(List)
    return this
}

type Item struct {
    Offset int = 5
    StrTest string = "test" + "test2"
    StrConstr string = "constr"
}

func NewItem(str_constr string) *Item {
    this := new(Item)
    this.StrConstr = str_constr
    return this
}

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