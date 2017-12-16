class List {
    public List<> items;
}

class Item {
    public Integer offset = 5;
    public String str_test = "test" + "test2";
    public String str_constr = "constr";

    public Item(String str_constr) {
        this.str_constr = str_constr;
    }
}

class Container {
    public List item_list;
    public List string_list;

    public void method0() throws Exception
    {
    }
    
    public void method1(String str) throws Exception
    {
        return str;
    }
}