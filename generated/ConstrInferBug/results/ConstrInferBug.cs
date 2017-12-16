public class TestClass
{
    public void MethodTest(List<string> methodParam)
    {
    }
    
    public void TestMethod()
    {
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