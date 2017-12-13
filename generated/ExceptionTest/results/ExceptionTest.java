class TestClass {
    public Integer notThrows() throws Exception
    {
        return 5;
    }
    
    public void fThrows() throws Exception
    {
        throw new Exception("exception message");
    }
    
    public void testMethod() throws Exception
    {
        System.out.println(this.notThrows());
        this.fThrows();
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