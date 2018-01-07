public class List<T>
{
    public List<T> Items;
}

public class Item
{
    public int Offset = 5;
    public string StrTest = "test" + "test2";
    public string StrConstr = "constr";

    public Item(string strConstr)
    {
        this.StrConstr = strConstr;
    }
}

public class Container
{
    public List<Item> ItemList;
    public List<string> StringList;

    public void Method0()
    {
    }
    
    public void Method1(string str)
    {
        return str;
    }
}