class TestClass {
    public void testMethod() throws Exception
    {
        String str = "a1A";
        for (Integer i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            boolean isUpper = 'A' <= c && c <= 'Z';
            boolean isLower = 'a' <= c && c <= 'z';
            boolean isNumber = '0' <= c && c <= '9';
            System.out.println(isUpper ? "upper" : isLower ? "lower" : isNumber ? "number" : "other");
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