class TokenType {
    public static String end_token = "EndToken";
    public static String whitespace = "Whitespace";
    public static String identifier = "Identifier";
    public static String operator_x = "Operator";
    public static String no_initializer;
}

class TestClass {
    public String testMethod() throws Exception
    {
        String casing_test = TokenType.end_token;
        return casing_test;
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