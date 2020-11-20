<?php

namespace OneFile;

class OneFile {
    static function listFiles($dir, $recursive) {
        if (!$recursive)
            throw "Not supported";

        $rii = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));

        $files = array(); 
        foreach ($rii as $file)
            if (!$file->isDir())
                $files[] = substr($file->getPathname(), strlen($dir));

        sort($files);
        return $files;
    }

    static function readText($fn) {
        return file_get_contents($fn);
    }

    static function writeText($fn, $contents) {
        //print("writing file: $fn\n");
        $dir = dirname($fn);
        if (!file_exists($dir))
            mkdir($dir, 0777, true);
        file_put_contents($fn, $contents);
    }
}