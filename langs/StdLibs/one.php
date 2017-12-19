<?php

class OneRegex {
    static function matchFromIndex($pattern, $input, $offset) {
        preg_match('/\G'.str_replace('/', '\/', $pattern).'/', $input, $matches, 0, $offset);
        return $matches;
    }
}
