import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

class TestClass {
    public void testMethod() throws Exception
    {
        List<Integer> constant_arr = new ArrayList<Integer>(Arrays.asList(5));
        
        List<Integer> mutable_arr = new ArrayList<Integer>(Arrays.asList(1));
        mutable_arr.add(2);
        
        System.out.println("len1: " + constant_arr.size() + ", len2: " + mutable_arr.size());
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