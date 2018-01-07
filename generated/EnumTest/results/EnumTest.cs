using System;

public enum TestEnum { Item1, Item2 }

public class TestClass
{
    public void TestMethod()
    {
        var enumV = TestEnum.Item1;
        if (3 * 2 == 6)
        {
            enumV = TestEnum.Item2;
        }
        
        var check1 = enumV == TestEnum.Item2 ? "SUCCESS" : "FAIL";
        var check2 = enumV == TestEnum.Item1 ? "FAIL" : "SUCCESS";
        
        Console.WriteLine($"Item1: {TestEnum.Item1}, Item2: {enumV}, checks: {check1} {check2}");
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