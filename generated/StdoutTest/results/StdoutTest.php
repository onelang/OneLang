<?php

class TestClass {
    function reverseString($str) {
        $result = "";
        for ($i = strlen($str) - 1; $i >= 0; $i--) {
            $result .= $str[$i];
        }
        return $result;
    }
    
    function testMethod() {
        print(($this->reverseString("print value")) . "\n");
        return "return value";
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}