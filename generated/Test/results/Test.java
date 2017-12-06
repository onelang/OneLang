import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

class TestClass {
    public Integer mapTest() throws Exception
    {
        HashMap<String, Integer> map_obj = new HashMap<String, Integer>();
        map_obj.put("x", 5);
        map_obj.put("y", 3);
        
        //let containsX = "x" in mapObj;
        map_obj.put("z", 9);
        map_obj.remove("x");
        
        List<String> keys_var = new ArrayList(map_obj.keySet());
        List<Integer> values_var = new ArrayList(map_obj.values());
        return map_obj.get("z");
    }
    
    public void explicitTypeTest() throws Exception
    {
        String op = "";
        System.out.println(op.length());
    }
    
    public String ifTest(Integer x) throws Exception
    {
        String result = "<unk>";
        
        if (x > 3) {
            result = "hello";
        } else if (x < 1) {
            result = "bello";
        } else if (x < 0) {
            result = "bello2";
        } else {
            result = "???";
        }
        
        if (x > 3) {
            result = "z";
        }
        
        if (x > 3) {
            result = "x";
        } else {
            result = "y";
        }
        
        return result;
    }
    
    public void arrayTest() throws Exception
    {
        //const c2 = new Class2();
        
        List<Integer> mutable_arr = new ArrayList<Integer>(Arrays.asList(1, 2));
        mutable_arr.add(3);
        mutable_arr.add(4);
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);
        
        List<Integer> constant_arr = new ArrayList<Integer>(Arrays.asList(5, 6));
        
        // some comment
        //   some comment line 2
        for (Integer item : mutable_arr) {
            System.out.println(item);
        }
        
        /* some other comment
           multiline and stuff
        */
        for (Integer i = 0; i < constant_arr.size(); i++) {
            System.out.println(constant_arr.get(i));
        }
    }
    
    public Integer calc() throws Exception
    {
        return (1 + 2) * 3;
    }
    
    public Integer methodWithArgs(Integer arg1, Integer arg2, Integer arg3) throws Exception
    {
        Integer stuff = arg1 + arg2 + arg3 * this.calc();
        return stuff;
    }
    
    public String stringTest() throws Exception
    {
        String x = "x";
        String y = "y";
        
        String z = "z";
        z += "Z";
        z += x;
        
        return z + "|" + x + y;
    }
    
    public String reverseString(String str) throws Exception
    {
        String result = "";
        for (Integer i = str.length() - 1; i >= 0; i--) {
            result += str.charAt(i);
        }
        return result;
    }
    
    public boolean getBoolResult(boolean value) throws Exception
    {
        return value;
    }
    
    public void testMethod() throws Exception
    {
        this.arrayTest();
        System.out.println(this.mapTest());
        System.out.println(this.stringTest());
        System.out.println(this.reverseString("print value"));
        System.out.println(this.getBoolResult(true) ? "true" : "false");
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}