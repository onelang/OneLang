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

$c = new TestClass();
$c->testMethod();