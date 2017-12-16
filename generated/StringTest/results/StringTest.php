<?php

class TestClass {
    function testMethod() {
        $x = "x";
        $y = "y";
        
        $z = "z";
        $z .= "Z";
        $z .= $x;
        
        $a = substr("abcdef", 2, 4 - 2);
        $arr = explode(" ", "ab  cd ef");
        
        return $z . "|" . $x . $y . "|" . $a . "|" . $arr[2];
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}