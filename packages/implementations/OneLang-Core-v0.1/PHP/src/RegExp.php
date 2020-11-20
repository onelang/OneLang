<?php

namespace OneCore;

class RegExp {
    public $regex;
    public $lastIndex = 0;

    function __construct($pattern, $flags = null) {
        //print("construct pattern=$pattern\n");
        $pattern = str_replace("/", "\\/", $pattern);
        $this->regex = "/$pattern/A";
    }

    function exec($input) {
        //print("preg_match, pattern='{$this->regex}', offset={$this->lastIndex}, input='" . str_replace("\n", "\\n", substr($input, $this->lastIndex, 30)) . "'\n");
        if (preg_match($this->regex, $input, $matches, PREG_OFFSET_CAPTURE, $this->lastIndex) === 0)
            return null;

        //var_dump($matches);
        $this->lastIndex = $matches[0][1] + strlen($matches[0][0]);
        //print("new offset={$this->lastIndex}\n");
        $result = array_map(function($x){ return $x[0]; }, $matches);
        //var_dump($result);
        return $result;
    }
}
