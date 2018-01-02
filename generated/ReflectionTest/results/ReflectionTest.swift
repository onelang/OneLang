class TargetClass {
  var instanceField: Int = 5
  static var staticField: String = "hello"

  class func staticMethod(arg1: String) -> String {
      return "arg1 = \(arg1), staticField = \(TargetClass.staticField)"
  }

  func instanceMethod() -> String {
      return "instanceField = \(self.instanceField)"
  }
}

let _ = OneReflect.addClass(OneClass(name: "TargetClass"))
  .addField(OneField("instanceField", false, "Int", { ($0 as! TargetClass).instanceField }, { ($0 as! TargetClass).instanceField = $1 as! Int }))
  .addField(OneField("staticField", true, "String", { _ in TargetClass.staticField }, { TargetClass.staticField = $1 as! String }))
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
      let method1Result: Any? = method1!.call(obj: obj, args: [Any]())
      print("instanceMethod: \(method1Result!)")
      
      let method2: OneMethod? = cls!.getMethod(name: "staticMethod")
      if method2 == nil {
          print("method2 is null!")
          return
      }
      let method2Result: Any? = method2!.call(obj: nil, args: ["arg1value"])
      print("staticMethod: \(method2Result!)")
      
      let field1: OneField? = cls!.getField(name: "instanceField")
      if field1 == nil {
          print("field1 is null!")
          return
      }
      field1!.setValue(obj: obj, value: 6)
      let field1NewVal: Any? = field1!.getValue(obj: obj)
      print("new instance field value: \(obj!.instanceField) == \(field1NewVal!)")
      
      let field2: OneField? = cls!.getField(name: "staticField")
      if field2 == nil {
          print("field2 is null!")
          return
      }
      field2!.setValue(obj: nil, value: "bello")
      let field2NewVal: Any? = field2!.getValue(obj: nil)
      print("new static field value: \(TargetClass.staticField) == \(field2NewVal!)")
  }
}

TestClass().testMethod()