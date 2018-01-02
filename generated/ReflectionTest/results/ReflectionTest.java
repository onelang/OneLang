import java.util.ArrayList;
import java.util.Arrays;

class TargetClass {
    static {
        OneReflect.publish(TargetClass.class);
    }

    public Integer instanceField = 5;
    public static String staticField = "hello";

    public static String staticMethod(String arg1) throws Exception
    {
        return "arg1 = " + arg1 + ", staticField = " + TargetClass.staticField;
    }
    
    public String instanceMethod() throws Exception
    {
        return "instanceField = " + this.instanceField;
    }
}

class TestClass {
    public void testMethod() throws Exception
    {
        TargetClass obj = new TargetClass();
        //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        //console.log(`instanceField (direct): ${obj.instanceField}`);
        //console.log(`staticField (direct): ${TargetClass.staticField}`);
        OneClass cls = OneReflect.getClass(obj);
        if (cls == null) {
            System.out.println("cls is null!");
            return;
        }
        OneClass cls2 = OneReflect.getClassByName("TargetClass");
        if (cls2 == null) {
            System.out.println("cls2 is null!");
            return;
        }
        
        OneMethod method1 = cls.getMethod("instanceMethod");
        if (method1 == null) {
            System.out.println("method1 is null!");
            return;
        }
        Object method1Result = method1.call(obj, new ArrayList<Object>(Arrays.asList()));
        System.out.println("instanceMethod: " + method1Result);
        
        OneMethod method2 = cls.getMethod("staticMethod");
        if (method2 == null) {
            System.out.println("method2 is null!");
            return;
        }
        Object method2Result = method2.call(null, new ArrayList<Object>(Arrays.asList("arg1value")));
        System.out.println("staticMethod: " + method2Result);
        
        OneField field1 = cls.getField("instanceField");
        if (field1 == null) {
            System.out.println("field1 is null!");
            return;
        }
        field1.setValue(obj, 6);
        Object field1NewVal = field1.getValue(obj);
        System.out.println("new instance field value: " + obj.instanceField + " == " + field1NewVal);
        
        OneField field2 = cls.getField("staticField");
        if (field2 == null) {
            System.out.println("field2 is null!");
            return;
        }
        field2.setValue(null, "bello");
        Object field2NewVal = field2.getValue(null);
        System.out.println("new static field value: " + TargetClass.staticField + " == " + field2NewVal);
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