class TestClass {
    public void testMethod() throws Exception
    {
        String str = "a1A";
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            String is_upper = "A" <= c && c <= "Z";
            String is_lower = "a" <= c && c <= "z";
            String is_number = "0" <= c && c <= "9";
            System.out.println(is_upper ? "upper" : is_lower ? "lower" : is_number ? "number" : "other");
        }
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}