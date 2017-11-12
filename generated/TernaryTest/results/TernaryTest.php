<?php

class TestClass {
    function getResult() {
        return TRUE;
    }
    
    function testMethod() {
        print(($this->getResult() ? "true" : "false") . "\n");
    }
}

$c = new TestClass();
$c->testMethod();