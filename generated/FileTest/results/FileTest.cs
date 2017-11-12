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
        new TestClass().TestMethod();
    }
}