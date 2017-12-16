<?php

class TestClass {
    function testMethod() {
        $file_content = file_get_contents("../../input/test.txt");
        return $file_content;
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}