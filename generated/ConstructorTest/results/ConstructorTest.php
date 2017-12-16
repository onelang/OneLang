<?php

class ConstructorTest {
    public $field2;
    public $field1;

    function __construct($field1) {
        $this->field1 = $field1;
        $this->field2 = $field1 * $this->field1 * 5;
    }
}

class TestClass {
    function testMethod() {
        $test = new ConstructorTest(3);
        print(($test->field2) . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}