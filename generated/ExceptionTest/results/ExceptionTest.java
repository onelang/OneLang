class TestClass {
    public void testMethod() throws Exception
    {
        throw new Exception("exception message");
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