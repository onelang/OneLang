using System;

public class MapX<K, V>
{
    public V Value;

    public void Set(K key, V value)
    {
        this.Value = value;
    }
    
    public V Get(K key)
    {
        return this.Value;
    }
}

public class TestClass
{
    public void TestMethod()
    {
        var mapX = new MapX<string, int>();
        mapX.Set("hello", 3);
        var numValue = mapX.Get("hello2");
        Console.WriteLine($"{numValue}");
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