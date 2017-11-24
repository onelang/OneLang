import java.util.HashMap;
import java.util.ArrayList;

class TestClass {
    public void testMethod() throws Exception
    {
        List<String> result = new ArrayList<String>(Arrays.asList());
        HashMap<String, int> map = new HashMap<String, int>();
        map.put("x", 5);
        List<String> keys = new ArrayList(map.keySet());
        System.out.println(result);
        System.out.println(keys);
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}