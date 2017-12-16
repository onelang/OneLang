using System;

public class ConstructorTest
{
    public int Field2;
    public int Field1;

    public ConstructorTest(int field1)
    {
        this.Field1 = field1;
        this.Field2 = field1 * this.Field1 * 5;
    }
}

public class TestClass
{
    public void TestMethod()
    {
        var test = new ConstructorTest(3);
        Console.WriteLine(test.Field2);
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