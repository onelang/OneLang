/// <reference path="../langs/StdLibs/stdlib.d.ts"/>

class TargetClass {
    instanceField = 5;
    static staticField = "hello";

    static staticMethod(arg1: string): string {
        return `arg1 = ${arg1}, staticField = ${TargetClass.staticField}`;
    }

    instanceMethod(): string {
        return `instanceField = ${this.instanceField}`;
    }
}

class TestClass {
    testMethod() {
        const obj = new TargetClass();
        //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        //console.log(`instanceField (direct): ${obj.instanceField}`);
        //console.log(`staticField (direct): ${TargetClass.staticField}`);
        const cls = OneReflect.getClass(obj);
        if (cls === null)
            console.log("cls is null!");

        const cls2 = OneReflect.getClassByName("TargetClass");
        if (cls2 === null)
            console.log("cls2 is null!");

        const method1 = cls.getMethod("instanceMethod");
        if (method1 === null)
            console.log("method1 is null!");

        const method1Result = method1.call(obj, []);
        console.log(`instanceMethod: ${method1Result}`);

        const method2 = cls.getMethod("staticMethod");
        if (method2 === null)
            console.log("method2 is null!");

        const method2Result = method2.call(null, <any[]>["arg1value"]);
        console.log(`staticMethod: ${method2Result}`);

        const field1 = cls.getField("instanceField");
        field1.setValue(obj, 6);
        console.log(`new instance field value: ${obj.instanceField}`);

        const field2 = cls.getField("staticField");
        field2.setValue(null, "bello");
        console.log(`new static field value: ${TargetClass.staticField}`);
    }
}