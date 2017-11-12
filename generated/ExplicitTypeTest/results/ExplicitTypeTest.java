class TestClass {
    public void testMethod() throws Exception
    {
        String op = null;
        System.out.println(op.length());
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}