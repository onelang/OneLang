using System.Linq;

public class TestClass
{
    public void TestMethod()
    {
        var map = new Dictionary<string, object>
        {
        };
        /* UNUSED: var keys = */ map.Keys.ToArray();
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