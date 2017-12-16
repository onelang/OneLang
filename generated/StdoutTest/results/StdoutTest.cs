using System;

public class TestClass
{
    public string ReverseString(string str)
    {
        var result = "";
        for (var i = str.Length - 1; i >= 0; i--)
        {
            result += str[i];
        }
        return result;
    }
    
    public string TestMethod()
    {
        Console.WriteLine(this.ReverseString("print value"));
        return "return value";
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