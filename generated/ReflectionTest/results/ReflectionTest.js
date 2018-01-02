const one = require('one');

class TargetClass {
  constructor() {
      this.instanceField = 5;
  }

  static staticMethod(arg1) {
    return `arg1 = ${arg1}, staticField = ${TargetClass.staticField}`;
  }
  
  instanceMethod() {
    return `instanceField = ${this.instanceField}`;
  }
}

TargetClass.staticField = "hello";

one.Reflect.setupClass(new one.Class(TargetClass, [
    new one.Field("instanceField", false, "OneNumber"),
    new one.Field("staticField", true, "OneString"),
  ], [
    new one.Method("staticMethod", true, "OneString", [
      new one.MethodArgument("arg1", "OneString"),
    ]),
    new one.Method("instanceMethod", false, "OneString", [
    ]),
  ]));

class TestClass {
  testMethod() {
    const obj = new TargetClass();
    //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
    //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
    //console.log(`instanceField (direct): ${obj.instanceField}`);
    //console.log(`staticField (direct): ${TargetClass.staticField}`);
    const cls = one.Reflect.getClass(obj);
    if (cls == null) {
        console.log("cls is null!");
        return;
    }
    const cls2 = one.Reflect.getClassByName("TargetClass");
    if (cls2 == null) {
        console.log("cls2 is null!");
        return;
    }
    
    const method1 = cls.getMethod("instanceMethod");
    if (method1 == null) {
        console.log("method1 is null!");
        return;
    }
    const method1Result = method1.call(obj, []);
    console.log(`instanceMethod: ${method1Result}`);
    
    const method2 = cls.getMethod("staticMethod");
    if (method2 == null) {
        console.log("method2 is null!");
        return;
    }
    const method2Result = method2.call(null, ["arg1value"]);
    console.log(`staticMethod: ${method2Result}`);
    
    const field1 = cls.getField("instanceField");
    if (field1 == null) {
        console.log("field1 is null!");
        return;
    }
    field1.setValue(obj, 6);
    const field1NewVal = field1.getValue(obj);
    console.log(`new instance field value: ${obj.instanceField} == ${field1NewVal}`);
    
    const field2 = cls.getField("staticField");
    if (field2 == null) {
        console.log("field2 is null!");
        return;
    }
    field2.setValue(null, "bello");
    const field2NewVal = field2.getValue(null);
    console.log(`new static field value: ${TargetClass.staticField} == ${field2NewVal}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}