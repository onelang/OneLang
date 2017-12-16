<?php

class TestClass {
    function testMethod() {
        $str_val = "str";
        $num = 1337;
        $b = TRUE;
        $result = "before " . ($str_val) . ", num: " . ($num) . ", true: " . (($b) ? "true" : "false") . " after";
        print(($result) . "\n");
        print(("before " . ($str_val) . ", num: " . ($num) . ", true: " . (($b) ? "true" : "false") . " after") . "\n");
        
        $result2 = "before " . $str_val . ", num: " . $num . ", true: " . (($b) ? "true" : "false") . " after";
        print(($result2) . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}