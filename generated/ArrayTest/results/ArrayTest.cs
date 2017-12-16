using System.Collections.Generic;
using System;

public class TestClass
{
    public void TestMethod()
    {
        var constantArr = new List<int> { 5 };
        
        var mutableArr = new List<int> { 1 };
        mutableArr.Add(2);
        
        Console.WriteLine($"len1: {constantArr.Count}, len2: {mutableArr.Count}");
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