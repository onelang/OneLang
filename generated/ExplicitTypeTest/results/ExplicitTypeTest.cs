using System;

public class TestClass
{
    public void TestMethod()
    {
        var op = null;
        Console.WriteLine(op.Length);
    }
}

public class Program
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}