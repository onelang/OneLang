public class TokenType
{
    public static string EndToken = "EndToken";
    public static string Whitespace = "Whitespace";
    public static string Identifier = "Identifier";
    public static string OperatorX = "Operator";
    public static string NoInitializer;
}

public class TestClass
{
    public string TestMethod()
    {
        var casingTest = TokenType.EndToken;
        return casingTest;
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