import one

class TargetClass:
    def __init__(self):
        self.instance_field = 5

    @staticmethod
    def static_method(arg1):
        return "arg1 = %s, staticField = %s" % (arg1, TargetClass.static_field, )
    
    def instance_method(self):
        return "instanceField = %s" % (self.instance_field, )

TargetClass.static_field = "hello";

one.Reflect.setup_class(one.Class(TargetClass, [
    one.Field("instance_field", False, "OneNumber"),
    one.Field("static_field", True, "OneString"),
  ], [
    one.Method("static_method", True, "OneString", [
      one.MethodArgument("arg1", "OneString"),
    ]),
    one.Method("instance_method", False, "OneString", [
    ]),
  ]));

class TestClass:
    def test_method(self):
        obj = TargetClass()
        #console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        #console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        #console.log(`instanceField (direct): ${obj.instanceField}`);
        #console.log(`staticField (direct): ${TargetClass.staticField}`);
        cls = one.Reflect.get_class(obj)
        if cls == None:
            print "cls is null!"
            return
        cls2 = one.Reflect.get_class_by_name("TargetClass")
        if cls2 == None:
            print "cls2 is null!"
            return
        
        method1 = cls.get_method("instanceMethod")
        if method1 == None:
            print "method1 is null!"
            return
        method1_result = method1.call(obj, [])
        print "instanceMethod: %s" % (method1_result, )
        
        method2 = cls.get_method("staticMethod")
        if method2 == None:
            print "method2 is null!"
            return
        method2_result = method2.call(None, ["arg1value"])
        print "staticMethod: %s" % (method2_result, )
        
        field1 = cls.get_field("instanceField")
        if field1 == None:
            print "field1 is null!"
            return
        field1.set_value(obj, 6)
        field1_new_val = field1.get_value(obj)
        print "new instance field value: %s == %s" % (obj.instance_field, field1_new_val, )
        
        field2 = cls.get_field("staticField")
        if field2 == None:
            print "field2 is null!"
            return
        field2.set_value(None, "bello")
        field2_new_val = field2.get_value(None)
        print "new static field value: %s == %s" % (TargetClass.static_field, field2_new_val, )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message