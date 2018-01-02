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
    Offset int
    StrTest string
    StrConstr string
}

func NewItem(str_constr string) *Item {
    this := new(Item)
    this.Offset = 5
    this.StrTest = "test" + "test2"
    this.StrConstr = "constr"
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

func init() {
}