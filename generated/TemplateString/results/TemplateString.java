class TestClass {
    public void testMethod() throws Exception
    {
        String strVal = "str";
        Integer num = 1337;
        boolean b = true;
        Object result = "before " + strVal + ", num: " + num + ", true: " + b + " after";
        System.out.println(result);
        System.out.println("before " + strVal + ", num: " + num + ", true: " + b + " after");
        
        String result2 = "before " + strVal + ", num: " + num + ", true: " + b + " after";
        System.out.println(result2);
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