import java.util.HashMap;
import java.util.ArrayList;

class TestClass {
    public void testMethod() throws Exception
    {
        HashMap<String, Object> map = new HashMap<String, Object>();
        
        List<String> keys = new ArrayList(map.keySet());
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}