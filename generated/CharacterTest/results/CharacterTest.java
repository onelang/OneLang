class TestClass {
    public void testMethod() throws Exception
    {
        String str = "a1A";
        for (Integer i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            boolean is_upper = 'A' <= c && c <= 'Z';
            boolean is_lower = 'a' <= c && c <= 'z';
            boolean is_number = '0' <= c && c <= '9';
            System.out.println(is_upper ? "upper" : is_lower ? "lower" : is_number ? "number" : "other");
        }
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