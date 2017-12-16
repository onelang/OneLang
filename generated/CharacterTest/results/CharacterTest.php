<?php

class TestClass {
    function testMethod() {
        $str = "a1A";
        for ($i = 0; $i < strlen($str); $i++) {
            $c = $str[$i];
            $is_upper = "A" <= $c && $c <= "Z";
            $is_lower = "a" <= $c && $c <= "z";
            $is_number = "0" <= $c && $c <= "9";
            print(($is_upper ? "upper" : ($is_lower ? "lower" : ($is_number ? "number" : ("other")))) . "\n");
        }
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}