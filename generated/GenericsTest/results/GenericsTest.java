class MapX {
    public void set(key, value) throws Exception
    {
        
    }
    
    public  get(key) throws Exception
    {
        return null;
    }
}

class Main {
    public void test() throws Exception
    {
        MapX map = new MapX();
        map.set("hello", 3);
        int num_value = map.get("hello2");
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}