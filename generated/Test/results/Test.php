<?php

class TestClass {
    function mapTest() {
        $map_obj = array(
          "x" => 5,
          "y" => 3,
        );
        
        //let containsX = "x" in mapObj;
        $map_obj["z"] = 9;
        unset($map_obj["x"]);
        
        $keys_var = array_keys($map_obj);
        $values_var = array_values($map_obj);
        return $map_obj["z"];
    }
    
    function explicitTypeTest() {
        $op = "";
        print((strlen($op)) . "\n");
    }
    
    function ifTest($x) {
        $result = "<unk>";
        
        if ($x > 3) {
            $result = "hello";
        } elseif ($x < 1) {
            $result = "bello";
        } elseif ($x < 0) {
            $result = "bello2";
        } else {
            $result = "???";
        }
        
        if ($x > 3) {
            $result = "z";
        }
        
        if ($x > 3) {
            $result = "x";
        } else {
            $result = "y";
        }
        
        return $result;
    }
    
    function arrayTest() {
        //const c2 = new Class2();
        
        $mutable_arr = array(1, 2);
        $mutable_arr[] = 3;
        $mutable_arr[] = 4;
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);
        
        $constant_arr = array(5, 6);
        
        // some comment
        //   some comment line 2
        foreach ($mutable_arr as $item) {
            print(($item) . "\n");
        }
        
        /* some other comment
           multiline and stuff
        */
        for ($i = 0; $i < count($constant_arr); $i++) {
            print(($constant_arr[$i]) . "\n");
        }
    }
    
    function calc() {
        return (1 + 2) * 3;
    }
    
    function methodWithArgs($arg1, $arg2, $arg3) {
        $stuff = $arg1 + $arg2 + $arg3 * $this->calc();
        return $stuff;
    }
    
    function stringTest() {
        $x = "x";
        $y = "y";
        
        $z = "z";
        $z .= "Z";
        $z .= $x;
        
        return $z . "|" . $x . $y;
    }
    
    function reverseString($str) {
        $result = "";
        for ($i = strlen($str) - 1; $i >= 0; $i--) {
            $result .= $str[$i];
        }
        return $result;
    }
    
    function getBoolResult($value) {
        return $value;
    }
    
    function testMethod() {
        $this->arrayTest();
        print(($this->mapTest()) . "\n");
        print(($this->stringTest()) . "\n");
        print(($this->reverseString("print value")) . "\n");
        print(($this->getBoolResult(TRUE) ? "true" : ("false")) . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}