public class MapX
{
    public void Set( key,  value)
    {
    }
    
    public  Get( key)
    {
        return null;
    }
}

public class Main
{
    public void Test()
    {
        var map = new MapX();
        map.Set("hello", 3);
        // UNUSED: var numValue = map.Get("hello2");
    }
}

public class Program
{
    static public void Main()
    {
        new TestClass().TestMethod();
    }
}