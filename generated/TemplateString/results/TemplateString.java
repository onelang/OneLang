class TestClass {
    public void testMethod() throws Exception
    {
        String str_val = "str";
        int num = 1337;
        boolean b = true;
        Object result = "before " + str_val + ", num: " + num + ", true: " + b + " after";
        System.out.println(result);
        System.out.println("before " + str_val + ", num: " + num + ", true: " + b + " after");
        
        String result2 = "before " + str_val + ", num: " + num + ", true: " + b + " after";
        System.out.println(result2);
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}