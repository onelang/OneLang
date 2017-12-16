using System.Collections.Generic;

public class TestClass
{
    public string TestMethod()
    {
        var x = "x";
        var y = "y";
        
        var z = "z";
        z += "Z";
        z += x;
        
        var a = "abcdef".Substring(2, 4 - 2);
        var arr = "ab  cd ef".Split(new[]{ " " }, StringSplitOptions.None);
        
        return z + "|" + x + y + "|" + a + "|" + arr[2];
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