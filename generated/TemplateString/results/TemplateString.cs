using System;

public class TestClass
{
    public void TestMethod()
    {
        var strVal = "str";
        var num = 1337;
        var b = true;
        var result = $"before {strVal}, num: {num}, true: {((b) ? "true" : "false")} after";
        Console.WriteLine(result);
        Console.WriteLine($"before {strVal}, num: {num}, true: {((b) ? "true" : "false")} after");
        
        var result2 = "before " + strVal + ", num: " + num + ", true: " + (b ? "true" : "false") + " after";
        Console.WriteLine(result2);
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