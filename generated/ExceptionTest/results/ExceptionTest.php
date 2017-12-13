<?php

class TestClass {
    function notThrows() {
        return 5;
    }
    
    function fThrows() {
        throw new Exception("exception message");
    }
    
    function testMethod() {
        print(($this->notThrows()) . "\n");
        $this->fThrows();
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}