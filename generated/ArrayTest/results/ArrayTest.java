import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class TestClass {
    public void testMethod() throws Exception
    {
        List<Integer> constantArr = new ArrayList<Integer>(Arrays.asList(5));
        
        List<Integer> mutableArr = new ArrayList<Integer>(Arrays.asList(1));
        mutableArr.add(2);
        
        System.out.println("len1: " + constantArr.size() + ", len2: " + mutableArr.size());
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