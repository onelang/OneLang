class MapX<K, V> {
    public V value;

    public void set(K key, V value) throws Exception
    {
        this.value = value;
    }
    
    public V get(K key) throws Exception
    {
        return this.value;
    }
}

class TestClass {
    public void testMethod() throws Exception
    {
        MapX<String, Integer> mapX = new MapX();
        mapX.set("hello", 3);
        Integer numValue = mapX.get("hello2");
        System.out.println(numValue);
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        try {
            new TestClass().testMethod();
        } catch (Exception err) {
            System.out.println("Exception: " + err.getMessage());
        }
    }
}