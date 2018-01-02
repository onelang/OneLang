class TestClass {
    public void methodTest(List<String> methodParam) throws Exception
    {
    }
    
    public void testMethod() throws Exception
    {
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