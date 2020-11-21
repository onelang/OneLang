<?php

namespace OneLang\Core;

class console {
    static function log($data) {
        print($data . "\n");
    }

    static function error($data) {
        print("[ERROR] " . $data . "\n");
    }
}
