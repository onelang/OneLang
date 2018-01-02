class TestClass {
    public void testMethod() throws Exception
    {
        String str = "ABCDEF";
        boolean tA0True = str.startsWith("A", 0);
        boolean tA1False = str.startsWith("A", 1);
        boolean tB1True = str.startsWith("B", 1);
        boolean tCD2True = str.startsWith("CD", 2);
        System.out.println(tA0True + " " + tA1False + " " + tB1True + " " + tCD2True);
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