using System;

public class TestClass
{
    public void TestMethod()
    {
        var str = "A x B x C x D";
        var result = str.Replace("x", "y");
        Console.WriteLine($"R: {result}, O: {str}");
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