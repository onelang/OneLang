<?php

namespace OneCore;

class ArrayHelper {
    static function sortBy($arr, $func) {
        usort($arr, function($a, $b) use ($func) { return $func($a) - $func($b); });
        return $arr;
    }

    static function find($arr, $func) {
        foreach($arr as $item)
            if ($func($item))
                return $item;
        return null;
    }

    static function every($arr, $func) {
        foreach($arr as $i => $item)
            if (!$func($item, $i))
                return false;
        return true;
    }

    static function some($arr, $func) { return self::find($arr, $func) !== null; }
}
