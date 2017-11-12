<?php

class TestClass {
    function testMethod() {
        $op = NULL;
        print((strlen($op)) . "\n");
    }
}

$c = new TestClass();
$c->testMethod();