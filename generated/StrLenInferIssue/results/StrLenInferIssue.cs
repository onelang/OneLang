public class StrLenInferIssue
{
    public int Test(string str)
    {
        return str.Length;
    }
}

public class Program
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}