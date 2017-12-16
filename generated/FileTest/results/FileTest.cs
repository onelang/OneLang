using System.IO;

public class TestClass
{
    public string TestMethod()
    {
        var fileContent = File.ReadAllText("../../input/test.txt");
        return fileContent;
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