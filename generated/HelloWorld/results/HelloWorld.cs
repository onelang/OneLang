using System;

public class TestClass
{
    public void TestMethod()
    {
        Console.WriteLine("Hello world!");
    }
}

public class Program
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}