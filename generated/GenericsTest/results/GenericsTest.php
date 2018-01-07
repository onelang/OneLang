<?php

class MapX {
    public $value;

    function set($key, $value) {
        $this->value = $value;
    }
    
    function get($key) {
        return $this->value;
    }
}

class TestClass {
    function testMethod() {
        $map_x = new MapX();
        $map_x->set("hello", 3);
        $num_value = $map_x->get("hello2");
        print(("" . ($num_value) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}