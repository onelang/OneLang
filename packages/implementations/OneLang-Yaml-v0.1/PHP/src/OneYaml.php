<?php

namespace OneLang\Yaml;

class ValueType {
    const NULL = 0;
    const BOOLEAN = 1;
    const NUMBER = 2;
    const STRING = 3;
    const ARRAY = 4;
    const OBJECT = 5;
}

class YamlValue {
    function __construct($value) {
        //var_dump($value);
        $this->value = $value;
    }

    function type() {
        if (is_null($this->value)) return ValueType::NULL;
        if (is_bool($this->value)) return ValueType::BOOLEAN;
        if (is_int($this->value) || is_float($this->value)) return ValueType::NUMBER;
        if (is_string($this->value)) return ValueType::STRING;
        if (is_array($this->value)) return ValueType::ARRAY;
        return ValueType::OBJECT;
    }

    function asStr() { return $this->value; }

    function dbl($key) { return array_key_exists($key, $this->value) ? $this->value[$key] : 0; }
    function str($key) { return array_key_exists($key, $this->value) ? $this->value[$key] : null; }
    function strArr($key) { return array_key_exists($key, $this->value) ? $this->value[$key] : []; }
    function arr($key) { return array_map(function($x) { return new YamlValue($x); }, $this->value[$key] ?? []); }
    function dict($key) { return $this->arr($key); }
    function obj($key) { return new YamlValue($this->value[$key]); }
}

class OneYaml { 
    static function load($str) {
        //print("YAML load -> $str\n");
        return new YamlValue(yaml_parse($str));
    }
}