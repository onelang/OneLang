import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

class TestClass {
    public String testMethod() throws Exception
    {
        String x = "x";
        String y = "y";
        
        String z = "z";
        z += "Z";
        z += x;
        
        String a = "abcdef".substring(2, 4);
        List<String> arr = Arrays.asList("ab  cd ef".split(" "));
        
        return z + "|" + x + y + "|" + a + "|" + arr.get(2);
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