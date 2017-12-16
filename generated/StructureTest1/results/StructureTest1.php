<?php

class List {
    public $items;
}

class Item {
    public $offset = 5;
    public $str_test = "test" . "test2";
    public $str_constr = "constr";

    function __construct($str_constr) {
        $this->str_constr = $str_constr;
    }
}

class Container {
    public $item_list;
    public $string_list;

    function method0() {
    }
    
    function method1($str) {
        return $str;
    }
}