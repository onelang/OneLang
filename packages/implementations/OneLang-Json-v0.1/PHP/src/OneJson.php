<?php

namespace OneLang\Json;

class OneJValue {
    function __construct($value) { $this->value = $value; }

    function asObject() { return new OneJObject($this->value); }
    function asString() { return $this->value; }
    function getArrayItems() { return array_map(function($item) { return new OneJValue($item); }, $this->value); }
}

class OneJObject {
    function __construct($value) { $this->value = $value; }

    function get($key) { return new OneJValue($this->value[$key]); }
}

class OneJson { 
    static function parse($str) {
        return new OneJValue(json_decode($str, TRUE));
    }
}