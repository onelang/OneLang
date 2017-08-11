using System;

public class TestClass
{
    public void TestMethod()
    {
        Console.WriteLine("Hello World!");
    }
}

public class HelloWorld
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}
