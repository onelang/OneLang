<?php

class TestEnum { 
    const Item1 = 0;
    const Item2 = 1;
};

class TestClass {
    function testMethod() {
        $enum_v = TestEnum::Item1;
        if (3 * 2 == 6) {
            $enum_v = TestEnum::Item2;
        }
        
        $check1 = $enum_v == TestEnum::Item2 ? "SUCCESS" : ("FAIL");
        $check2 = $enum_v == TestEnum::Item1 ? "FAIL" : ("SUCCESS");
        
        print(("Item1: " . (TestEnum::Item1) . ", Item2: " . ($enum_v) . ", checks: " . ($check1) . " " . ($check2) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}