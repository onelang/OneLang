<?php

class TestClass {
    function methodTest($method_param) {
    }
    
    function testMethod() {
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}