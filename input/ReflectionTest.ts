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
        var obj = new TargetClass();
        //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        //console.log(`instanceField (direct): ${obj.instanceField}`);
        //console.log(`staticField (direct): ${TargetClass.staticField}`);
        var cls = OneReflect.getClass(obj);
        var cls2 = OneReflect.classes["TargetClass"];
        if (!cls || cls !== cls2)
            console.log("Fail!");

        var method1 = cls.methods["instanceMethod"];
        var method1Result = method1.call(obj, []);
        console.log(`instanceMethod: ${method1Result}`);

        var method2 = cls.methods["staticMethod"];
        var method2Result = method2.call(null, ["arg1value"]);
        console.log(`staticMethod: ${method2Result}`);
    }
}