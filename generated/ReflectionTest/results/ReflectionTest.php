<?php

class TargetClass {
    public $instance_field = 5;
    public static $static_field = "hello";

    static function staticMethod($arg1) {
        return "arg1 = " . ($arg1) . ", staticField = " . (TargetClass::$static_field) . "";
    }
    
    function instanceMethod() {
        return "instanceField = " . ($this->instance_field) . "";
    }
}

OneReflect::setupClass(new OneClass("TargetClass", [
    new OneField("instance_field", false, "OneNumber"),
    new OneField("static_field", true, "OneString"),
  ], [
    new OneMethod("staticMethod", true, "OneString", [
      new OneMethodArgument("arg1", "OneString"),
    ]),
    new OneMethod("instanceMethod", false, "OneString", [
    ]),
  ]));

class TestClass {
    function testMethod() {
        $obj = new TargetClass();
        //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        //console.log(`instanceField (direct): ${obj.instanceField}`);
        //console.log(`staticField (direct): ${TargetClass.staticField}`);
        $cls = OneReflect::getClass($obj);
        if ($cls == NULL) {
            print(("cls is null!") . "\n");
            return;
        }
        $cls2 = OneReflect::getClassByName("TargetClass");
        if ($cls2 == NULL) {
            print(("cls2 is null!") . "\n");
            return;
        }
        
        $method1 = $cls->getMethod("instanceMethod");
        if ($method1 == NULL) {
            print(("method1 is null!") . "\n");
            return;
        }
        $method1_result = $method1->call($obj, array());
        print(("instanceMethod: " . ($method1_result) . "") . "\n");
        
        $method2 = $cls->getMethod("staticMethod");
        if ($method2 == NULL) {
            print(("method2 is null!") . "\n");
            return;
        }
        $method2_result = $method2->call(NULL, array("arg1value"));
        print(("staticMethod: " . ($method2_result) . "") . "\n");
        
        $field1 = $cls->getField("instanceField");
        if ($field1 == NULL) {
            print(("field1 is null!") . "\n");
            return;
        }
        $field1->setValue($obj, 6);
        $field1_new_val = $field1->getValue($obj);
        print(("new instance field value: " . ($obj->instance_field) . " == " . ($field1_new_val) . "") . "\n");
        
        $field2 = $cls->getField("staticField");
        if ($field2 == NULL) {
            print(("field2 is null!") . "\n");
            return;
        }
        $field2->setValue(NULL, "bello");
        $field2_new_val = $field2->getValue(NULL);
        print(("new static field value: " . (TargetClass::$static_field) . " == " . ($field2_new_val) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}