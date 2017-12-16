class TestClass {
    public void testMethod() throws Exception
    {
        boolean a = true;
        boolean b = false;
        boolean c = a && b;
        boolean d = a || b;
        System.out.println("a: " + a + ", b: " + b + ", c: " + c + ", d: " + d);
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