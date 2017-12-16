<?php

class TestClass {
    function testMethod() {
        $constant_arr = array(5);
        
        $mutable_arr = array(1);
        $mutable_arr[] = 2;
        
        print(("len1: " . (count($constant_arr)) . ", len2: " . (count($mutable_arr)) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}