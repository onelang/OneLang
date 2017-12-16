using System;

public class TestClass
{
    public void TestMethod()
    {
        var a = true;
        var b = false;
        var c = a && b;
        var d = a || b;
        Console.WriteLine($"a: {((a) ? "true" : "false")}, b: {((b) ? "true" : "false")}, c: {((c) ? "true" : "false")}, d: {((d) ? "true" : "false")}");
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