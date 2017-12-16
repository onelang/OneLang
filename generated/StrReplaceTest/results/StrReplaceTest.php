<?php

class TestClass {
    function testMethod() {
        $str = "A x B x C x D";
        $result = str_replace("x", "y", $str);
        print(("R: " . ($result) . ", O: " . ($str) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}