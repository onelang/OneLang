class TargetClass {
  var instance_field: Int = 5
  static var static_field: String = "hello"

  class func staticMethod(arg1: String) -> String {
      return "arg1 = \(arg1), staticField = \(TargetClass.static_field)"
  }

  func instanceMethod() -> String {
      return "instanceField = \(self.instance_field)"
  }
}

let _ = OneReflect.addClass(OneClass(name: "TargetClass"))
  .addField(OneField("instance_field", false, "Int", { ($0 as! TargetClass).instance_field }, { ($0 as! TargetClass).instance_field = $1 as! Int }))
  .addField(OneField("static_field", true, "String", { _ in TargetClass.static_field }, { TargetClass.static_field = $1 as! String }))
  .addMethod(OneMethod("staticMethod", true, "String", [
      OneMethodArgument("arg1", "String"),
    ],
    { obj, args in TargetClass.staticMethod(arg1: args[0] as! String) }))
  .addMethod(OneMethod("instanceMethod", false, "String", [
    ],
    { obj, args in (obj as! TargetClass).instanceMethod() }))

class TestClass {
  func testMethod() -> Void {
      let obj: TargetClass? = TargetClass()
      //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
      //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
      //console.log(`instanceField (direct): ${obj.instanceField}`);
      //console.log(`staticField (direct): ${TargetClass.staticField}`);
      let cls: OneClass? = OneReflect.getClass(obj: obj)
      if cls == nil {
          print("cls is null!")
          return
      }
      let cls2: OneClass? = OneReflect.getClassByName(name: "TargetClass")
      if cls2 == nil {
          print("cls2 is null!")
          return
      }
      
      let method1: OneMethod? = cls!.getMethod(name: "instanceMethod")
      if method1 == nil {
          print("method1 is null!")
          return
      }
      let method1_result: Any? = method1!.call(obj: obj, args: [Any]())
      print("instanceMethod: \(method1_result!)")
      
      let method2: OneMethod? = cls!.getMethod(name: "staticMethod")
      if method2 == nil {
          print("method2 is null!")
          return
      }
      let method2_result: Any? = method2!.call(obj: nil, args: ["arg1value"])
      print("staticMethod: \(method2_result!)")
      
      let field1: OneField? = cls!.getField(name: "instanceField")
      if field1 == nil {
          print("field1 is null!")
          return
      }
      field1!.setValue(obj: obj, value: 6)
      let field1_new_val: Any? = field1!.getValue(obj: obj)
      print("new instance field value: \(obj!.instance_field) == \(field1_new_val!)")
      
      let field2: OneField? = cls!.getField(name: "staticField")
      if field2 == nil {
          print("field2 is null!")
          return
      }
      field2!.setValue(obj: nil, value: "bello")
      let field2_new_val: Any? = field2!.getValue(obj: nil)
      print("new static field value: \(TargetClass.static_field) == \(field2_new_val!)")
  }
}

TestClass().testMethod()