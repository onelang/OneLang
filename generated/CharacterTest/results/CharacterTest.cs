using System;

public class TestClass
{
    public void TestMethod()
    {
        var str = "a1A";
        for (var i = 0; i < str.Length; i++)
        {
            var c = str[i];
            var isUpper = 'A' <= c && c <= 'Z';
            var isLower = 'a' <= c && c <= 'z';
            var isNumber = '0' <= c && c <= '9';
            Console.WriteLine(isUpper ? "upper" : isLower ? "lower" : isNumber ? "number" : "other");
        }
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