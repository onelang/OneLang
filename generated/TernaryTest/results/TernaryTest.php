<?php

class TestClass {
    function getResult() {
        return TRUE;
    }
    
    function testMethod() {
        print(($this->getResult() ? "true" : ("false")) . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}