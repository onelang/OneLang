<?php

namespace OneLang\Core;

class Map {
    public $arr = array();

    function values() { return array_values($this->arr); }
    function has($key) { return array_key_exists($key, $this->arr); }
    function get($key) { return $this->arr[$key] ?? null; }
    function set($key, $value) { $this->arr[$key] = $value; }
    function delete($key) { unset($this->arr[$key]); }
}
