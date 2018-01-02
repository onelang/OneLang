using System.Linq;
using System;
using System.Collections.Generic;

public class TestClass
{
    public int MapTest()
    {
        var mapObj = new Dictionary<string, int>
        {
          { "x", 5 },
          { "y", 3 }
        };
        
        //let containsX = "x" in mapObj;
        mapObj["z"] = 9;
        mapObj.Remove("x");
        
        /* UNUSED: var keysVar = */ mapObj.Keys.ToArray();
        /* UNUSED: var valuesVar = */ mapObj.Values.ToArray();
        return mapObj["z"];
    }
    
    public void ExplicitTypeTest()
    {
        var op = "";
        Console.WriteLine(op.Length);
    }
    
    public string IfTest(int x)
    {
        var result = "<unk>";
        
        if (x > 3)
        {
            result = "hello";
        }
        else if (x < 1)
        {
            result = "bello";
        }
        else if (x < 0)
        {
            result = "bello2";
        }
        else
        {
            result = "???";
        }
        
        if (x > 3)
        {
            result = "z";
        }
        
        if (x > 3)
        {
            result = "x";
        }
        else
        {
            result = "y";
        }
        
        return result;
    }
    
    public void ArrayTest()
    {
        //const c2 = new Class2();
        
        var mutableArr = new List<int> { 1, 2 };
        mutableArr.Add(3);
        mutableArr.Add(4);
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);
        
        var constantArr = new List<int> { 5, 6 };
        
        // some comment
        //   some comment line 2
        foreach (var item in mutableArr)
        {
            Console.WriteLine(item);
        }
        
        /* some other comment
           multiline and stuff
        */
        for (var i = 0; i < constantArr.Count; i++)
        {
            Console.WriteLine(constantArr[i]);
        }
    }
    
    public int Calc()
    {
        return (1 + 2) * 3;
    }
    
    public int MethodWithArgs(int arg1, int arg2, int arg3)
    {
        var stuff = arg1 + arg2 + arg3 * this.Calc();
        return stuff;
    }
    
    public string StringTest()
    {
        var x = "x";
        var y = "y";
        
        var z = "z";
        z += "Z";
        z += x;
        
        return z + "|" + x + y;
    }
    
    public string ReverseString(string str)
    {
        var result = "";
        for (var i = str.Length - 1; i >= 0; i--)
        {
            result += str[i];
        }
        return result;
    }
    
    public bool GetBoolResult(bool value)
    {
        return value;
    }
    
    public void TestMethod()
    {
        this.ArrayTest();
        Console.WriteLine(this.MapTest());
        Console.WriteLine(this.StringTest());
        Console.WriteLine(this.ReverseString("print value"));
        Console.WriteLine(this.GetBoolResult(true) ? "true" : "false");
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