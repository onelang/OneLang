class TestClass {
    public void testMethod() throws Exception
    {
        System.out.println("Hello world!");
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}