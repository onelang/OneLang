<?php

class SomeKind { 
    const EnumVal0 = 0;
    const EnumVal1 = 1;
    const EnumVal2 = 2;
};

class TestClass {
    public $enum_field = SomeKind::EnumVal2;

    function testMethod() {
        print(("Value: " . ($this->enum_field) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}