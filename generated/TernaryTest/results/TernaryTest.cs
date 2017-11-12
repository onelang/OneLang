using System;

public class TestClass
{
    public bool GetResult()
    {
        return true;
    }
    
    public void TestMethod()
    {
        Console.WriteLine(this.GetResult() ? "true" : "false");
    }
}

public class Program
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}