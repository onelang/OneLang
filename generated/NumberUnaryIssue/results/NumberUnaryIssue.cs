public class NumberUnaryIssue
{
    public void Test(int num)
    {
        num--;
    }
}

public class Program
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}