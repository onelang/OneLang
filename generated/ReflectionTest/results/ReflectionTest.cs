using System;
using System.Collections.Generic;

public class TargetClass
{
    static TargetClass()
    {
        OneReflect.Publish(typeof(TargetClass));
    }

    public int InstanceField = 5;
    public static string StaticField = "hello";

    public static string StaticMethod(string arg1)
    {
        return $"arg1 = {arg1}, staticField = {TargetClass.StaticField}";
    }
    
    public string InstanceMethod()
    {
        return $"instanceField = {this.InstanceField}";
    }
}

public class TestClass
{
    public void TestMethod()
    {
        var obj = new TargetClass();
        //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        //console.log(`instanceField (direct): ${obj.instanceField}`);
        //console.log(`staticField (direct): ${TargetClass.staticField}`);
        var cls = OneReflect.GetClass(obj);
        if (cls == null)
        {
            Console.WriteLine("cls is null!");
            return;
        }
        var cls2 = OneReflect.GetClassByName("TargetClass");
        if (cls2 == null)
        {
            Console.WriteLine("cls2 is null!");
            return;
        }
        
        var method1 = cls.GetMethod("instanceMethod");
        if (method1 == null)
        {
            Console.WriteLine("method1 is null!");
            return;
        }
        var method1Result = method1.Call(obj, (new List<object> {  }).ToArray());
        Console.WriteLine($"instanceMethod: {method1Result}");
        
        var method2 = cls.GetMethod("staticMethod");
        if (method2 == null)
        {
            Console.WriteLine("method2 is null!");
            return;
        }
        var method2Result = method2.Call(null, (new List<object> { "arg1value" }).ToArray());
        Console.WriteLine($"staticMethod: {method2Result}");
        
        var field1 = cls.GetField("instanceField");
        if (field1 == null)
        {
            Console.WriteLine("field1 is null!");
            return;
        }
        field1.SetValue(obj, 6);
        var field1NewVal = field1.GetValue(obj);
        Console.WriteLine($"new instance field value: {obj.InstanceField} == {field1NewVal}");
        
        var field2 = cls.GetField("staticField");
        if (field2 == null)
        {
            Console.WriteLine("field2 is null!");
            return;
        }
        field2.SetValue(null, "bello");
        var field2NewVal = field2.GetValue(null);
        Console.WriteLine($"new static field value: {TargetClass.StaticField} == {field2NewVal}");
    }
}

public class Program
{
    static public void Main()
    {
        try 
        {
            new TestClass().TestMethod();
        }
        catch (System.Exception e)
        {
            System.Console.WriteLine($"Exception: {e.Message}");
        }
    }
}