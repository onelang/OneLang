<?php

namespace OneLang;

require __DIR__ . '/vendor/autoload.php';
require_once("OneLoader.php");

use OneLang\Test\SelfTestRunner\SelfTestRunner;
use OneLang\Generator\CsharpGenerator\CsharpGenerator;

$testRunner = new SelfTestRunner("../../");
$csharpGen = new CsharpGenerator();
try {
    $testRunner->runTest($csharpGen);
} catch(Error $e) {
    print($e->getMessage() . "\n");
}