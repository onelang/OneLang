using System;

public enum SomeKind { EnumVal0, EnumVal1, EnumVal2 }

public class TestClass
{
    public SomeKind EnumField = SomeKind.EnumVal2;

    public void TestMethod()
    {
        Console.WriteLine($"Value: {this.EnumField}");
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