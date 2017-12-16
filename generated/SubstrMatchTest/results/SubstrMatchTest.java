class TestClass {
    public void testMethod() throws Exception
    {
        String str = "ABCDEF";
        boolean t_a0_true = str.startsWith("A", 0);
        boolean t_a1_false = str.startsWith("A", 1);
        boolean t_b1_true = str.startsWith("B", 1);
        boolean t_c_d2_true = str.startsWith("CD", 2);
        System.out.println(t_a0_true + " " + t_a1_false + " " + t_b1_true + " " + t_c_d2_true);
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