class List {
    public List<> items;
}

class Item {
    public Integer offset = 5;
    public String strTest = "test" + "test2";
    public String strConstr = "constr";

    public Item(String strConstr) throws Exception {
        this.strConstr = strConstr;
    }
}

class Container {
    public List itemList;
    public List stringList;

    public void method0() throws Exception
    {
    }
    
    public void method1(String str) throws Exception
    {
        return str;
    }
}