class MapX {
    public void set( key,  value) throws Exception
    {
    }
    
    public  get( key) throws Exception
    {
        return null;
    }
}

class Main {
    public void test() throws Exception
    {
        MapX map = new MapX();
        map.set("hello", 3);
        Integer numValue = map.get("hello2");
    }
}