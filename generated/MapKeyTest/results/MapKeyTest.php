<?php

class TestClass {
    function testMethod() {
        $map = array(
        );
        $keys = array_keys($map);
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}