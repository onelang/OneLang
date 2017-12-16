class TestClass {
    public void testMethod() throws Exception
    {
        String str = "A x B x C x D";
        String result = str.replace("x", "y");
        System.out.println("R: " + result + ", O: " + str);
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