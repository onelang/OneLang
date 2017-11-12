<?php

class StrLenInferIssue {
    function test($str) {
        return strlen($str);
    }
}

$c = new TestClass();
$c->testMethod();