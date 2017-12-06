<?php

class MapX {
    function set($key, $value) {
    }
    
    function get($key) {
        return NULL;
    }
}

class Main {
    function test() {
        $map = new MapX();
        $map->set("hello", 3);
        $num_value = $map->get("hello2");
    }
}

$c = new TestClass();
$c->testMethod();