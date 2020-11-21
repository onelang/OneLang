<?php

namespace OneLang\Core;

class Set {
    public $arr = array();

    function __construct($items = array()) {
        foreach($items as $item)
            $this->add($item);
    }

    function values() { return array_values($this->arr); }
    function has($item) { return in_array($item, $this->arr); }
    function add($item) { if(!$this->has($item)) $this->arr[] = $item; }
}