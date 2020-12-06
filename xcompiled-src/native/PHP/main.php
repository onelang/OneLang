<?php

namespace OneLang;

require __DIR__ . '/vendor/autoload.php';
require_once("OneLoader.php");

use OneLang\Test\TestRunner\TestRunner;

$testRunner = new TestRunner("../../", $argv);
try {
    $testRunner->runTests();
} catch(Error $e) {
    print($e->getMessage() . "\n");
}