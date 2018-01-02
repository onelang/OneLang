import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

class TestClass {
    public void testMethod() throws Exception
    {
        List<String> result = new ArrayList<String>(Arrays.asList());
        HashMap<String, Integer> map = new HashMap<String, Integer>();
        map.put("x", 5);
        List<String> keys = new ArrayList(map.keySet());
        System.out.println(result);
        System.out.println(keys);
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