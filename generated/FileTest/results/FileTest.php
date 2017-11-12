<?php

class TestClass {
    function testMethod() {
        $file_content = file_get_contents("../../input/test.txt");
        return $file_content;
    }
}

$c = new TestClass();
$c->testMethod();