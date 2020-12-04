<?php

namespace OneLang;

require __DIR__ . '/vendor/autoload.php';
require_once("OneLoader.php");

use OneLang\Test\SelfTestRunner\SelfTestRunner;

$testRunner = new SelfTestRunner("../../");
try {
    $testRunner->runTest();
} catch(Error $e) {
    print($e->getMessage() . "\n");
}