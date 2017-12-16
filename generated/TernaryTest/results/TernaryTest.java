class TestClass {
    public boolean getResult() throws Exception
    {
        return true;
    }
    
    public void testMethod() throws Exception
    {
        System.out.println(this.getResult() ? "true" : "false");
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