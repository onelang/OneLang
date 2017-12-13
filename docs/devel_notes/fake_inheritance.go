package main

import "fmt"

type BaseMethods interface {
    Impl() float32
    UsesImpl() float32
}

type Base struct {
    methods BaseMethods
    value float32
}

type KeepsImpl struct { Base }
type OverridesImpl struct { Base }

func (t *Base) Impl() float32 { return t.value }
func (t *Base) UsesImpl() float32 { return t.methods.Impl() + 1 }

func (t *OverridesImpl) Impl() float32 { return t.value * t.value }

func main() {
    t1 := &KeepsImpl{Base{nil, 2}}
    t1.methods = t1
    t2 := &OverridesImpl{Base{nil, 2}}
    t2.methods = t2

    bases := []BaseMethods{t1, t2}

    for s, _ := range bases {
        switch bases[s].(type) {
        case *KeepsImpl:
            fmt.Println("KeepsImpl")
        case *OverridesImpl:
            fmt.Println("OverridesImpl")
        }

        fmt.Printf("The value is:  %f\n", bases[s].UsesImpl())
    }   
}