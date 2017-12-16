<?php

class TestClass {
    function testMethod() {
        $op = NULL;
        print((strlen($op)) . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}