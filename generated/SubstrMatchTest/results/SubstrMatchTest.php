<?php

class TestClass {
    function testMethod() {
        $str = "ABCDEF";
        $t_a0_true = substr_compare($str, "A", 0, strlen("A")) === 0;
        $t_a1_false = substr_compare($str, "A", 1, strlen("A")) === 0;
        $t_b1_true = substr_compare($str, "B", 1, strlen("B")) === 0;
        $t_c_d2_true = substr_compare($str, "CD", 2, strlen("CD")) === 0;
        print(("" . (($t_a0_true) ? "true" : "false") . " " . (($t_a1_false) ? "true" : "false") . " " . (($t_b1_true) ? "true" : "false") . " " . (($t_c_d2_true) ? "true" : "false") . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}