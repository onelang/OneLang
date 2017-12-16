<?php

class TestClass {
    function testMethod() {
        $result = array();
        $map = array(
          "x" => 5,
        );
        $keys = array_keys($map);
        print(($result) . "\n");
        print(($keys) . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}