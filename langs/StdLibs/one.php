<?php

class OneRegex {
    static function matchFromIndex($pattern, $input, $offset) {
        preg_match('/\G'.str_replace('/', '\/', $pattern).'/', $input, $matches, 0, $offset);
        return $matches;
    }
}

class OneReflect {
    static $classes = array();

    static function getClass($obj) { 
        return OneReflect::getClassByName(get_class($obj));
    }

    static function getClassByName($name) {
        $key = OneReflect::nameKey($name);
        return array_key_exists($key, OneReflect::$classes) ? OneReflect::$classes[$key] : NULL;
    }

    static function setupClass($cls) {
        OneReflect::$classes[OneReflect::nameKey($cls->name)] = $cls;
    }

    static function nameKey($name) {
        return str_replace("_", "", strtolower($name));
    }
}

class OneClass {
    function __construct($name, $fields, $methods) {
        $this->name = $name;

        $this->fields = array();
        foreach ($fields as $field) {
            $field->cls = $this;
            $this->fields[OneReflect::nameKey($field->name)] = $field;
        }

        $this->methods = array();
        foreach ($methods as $method) {
            $method->cls = $this;
            $this->methods[OneReflect::nameKey($method->name)] = $method;
        }
    }

    function getField($name) { return $this->fields[OneReflect::nameKey($name)]; }
    function getMethod($name) { return $this->methods[OneReflect::nameKey($name)]; }
    function getFields() { return array_values($this->fields); }
    function getMethods() { return array_values($this->methods); }
}

class OneField {
    function __construct($name, $isStatic, $type) {
        $this->name = $name;
        $this->isStatic = $isStatic;
        $this->type = $type;
    }

    function getValue($obj) {
        if ($this->isStatic) {
            $field = $this->name;
            $obj = $this->cls->name;
            return $obj::$$field;
        } else {
            return $obj->{$this->name};
        }
    }

    function setValue($obj, $value) {
        if ($this->isStatic) {
            $field = $this->name;
            $obj = $this->cls->name;
            $obj::$$field = $value;
        } else {
            $obj->{$this->name} = $value;
        }
    }
}

class OneMethod {
    function __construct($name, $isStatic, $returnType, $args) {
        $this->name = $name;
        $this->isStatic = $isStatic;
        $this->returnType = $returnType;
        $this->args = $args;
    }

    function call($obj, $args) {
        $gotArgCount = count($args);
        $expectedArgCount = count($this->args);
        if ($gotArgCount !== $expectedArgCount)
            throw new Exception("Expected {$expectedArgCount} arguments, but got {$gotArgCount} in {$this->cls->name}::{$this->name} call!");

        $realObj = $this->isStatic ? $this->cls->name : $obj;
        return call_user_func_array(array($realObj, $this->name), $args);
    }
}

class OneMethodArgument {
    function __construct($name, $type) {
        $this->name = $name;
        $this->type = $type;
    }
}
