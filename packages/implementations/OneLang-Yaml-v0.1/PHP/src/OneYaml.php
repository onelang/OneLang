<?php

namespace OneYaml;

class YamlValue {
    function __construct($value) {
        //var_dump($value);
        $this->value = $value;
    }

    function dbl($key) { return @$this->value[$key] ?? 0; }
    function str($key) { return @$this->value[$key] ?? null; }
    function strArr($key) { return $this->value[$key] ?? []; }
    function arr($key) { return array_map(function($x) { return new YamlValue($x); }, $this->value[$key] ?? []); }
    function obj($key) { return new YamlValue($this->value[$key]); }
}

class OneYaml { 
    static function load($str) {
        //print("YAML load -> $str\n");
        return new YamlValue(yaml_parse($str));
    }
}