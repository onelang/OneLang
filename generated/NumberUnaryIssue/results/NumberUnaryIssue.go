package main

import "fmt"
type NumberUnaryIssue struct {
}

func NewNumberUnaryIssue() *NumberUnaryIssue {
    this := new(NumberUnaryIssue)
    return this
}

func (this *NumberUnaryIssue) Test(num int) {
    num--
}

func init() {
}