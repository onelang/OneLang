import java.util.HashMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class TestClass {
    public Integer mapTest() throws Exception
    {
        HashMap<String, Integer> mapObj = new HashMap<String, Integer>();
        mapObj.put("x", 5);
        mapObj.put("y", 3);
        
        //let containsX = "x" in mapObj;
        mapObj.put("z", 9);
        mapObj.remove("x");
        
        List<String> keysVar = new ArrayList(mapObj.keySet());
        List<Integer> valuesVar = new ArrayList(mapObj.values());
        return mapObj.get("z");
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
        
        List<Integer> mutableArr = new ArrayList<Integer>(Arrays.asList(1, 2));
        mutableArr.add(3);
        mutableArr.add(4);
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);
        
        List<Integer> constantArr = new ArrayList<Integer>(Arrays.asList(5, 6));
        
        // some comment
        //   some comment line 2
        for (Integer item : mutableArr) {
            System.out.println(item);
        }
        
        /* some other comment
           multiline and stuff
        */
        for (Integer i = 0; i < constantArr.size(); i++) {
            System.out.println(constantArr.get(i));
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
        try {
            new TestClass().testMethod();
        } catch (Exception err) {
            System.out.println("Exception: " + err.getMessage());
        }
    }
}