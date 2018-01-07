package main

import "fmt"
type List struct {
    Items []interface{}
}

func NewList() *List {
    this := new(List)
    return this
}

type Item struct {
    Offset int
    StrTest string
    StrConstr string
}

func NewItem(strConstr string) *Item {
    this := new(Item)
    this.Offset = 5
    this.StrTest = "test" + "test2"
    this.StrConstr = "constr"
    this.StrConstr = strConstr
    return this
}

type Container struct {
    ItemList *List<Item>
    StringList *List<string>
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

func init() {
}