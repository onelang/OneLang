<?php

namespace OneLang\File;

class OneFile {
    static function listFiles($dir, $recursive) {
        if (!$recursive)
            throw "Not supported";
        if (substr($dir, -1) !== "/")
            $dir .= "/";

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

    static function providePath($fn) { 
        $dir = dirname($fn);
        if (!file_exists($dir))
            mkdir($dir, 0777, true);
        return $fn;
    }

    static function writeText($fn, $contents) {
        //print("writing file: $fn\n");
        file_put_contents(OneFile::providePath($fn), $contents);
    }

    static function copy($src, $dst) {
        copy($src, OneFile::providePath($dst));
    }
}