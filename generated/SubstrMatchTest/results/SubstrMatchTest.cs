using System;

public class TestClass
{
    public void TestMethod()
    {
        var str = "ABCDEF";
        var tA0True = String.Compare(str, 0, "A", 0, ("A").Length) == 0;
        var tA1False = String.Compare(str, 1, "A", 0, ("A").Length) == 0;
        var tB1True = String.Compare(str, 1, "B", 0, ("B").Length) == 0;
        var tCD2True = String.Compare(str, 2, "CD", 0, ("CD").Length) == 0;
        Console.WriteLine($"{((tA0True) ? "true" : "false")} {((tA1False) ? "true" : "false")} {((tB1True) ? "true" : "false")} {((tCD2True) ? "true" : "false")}");
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