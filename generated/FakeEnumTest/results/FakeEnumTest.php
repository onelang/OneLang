<?php

class TokenType {
    public static $end_token = "EndToken";
    public static $whitespace = "Whitespace";
    public static $identifier = "Identifier";
    public static $operator_x = "Operator";
    public static $no_initializer;
}

class TestClass {
    function testMethod() {
        $casing_test = TokenType::$end_token;
        return $casing_test;
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}