class TokenType {
    public static String endToken = "EndToken";
    public static String whitespace = "Whitespace";
    public static String identifier = "Identifier";
    public static String operatorX = "Operator";
    public static String noInitializer;
}

class TestClass {
    public String testMethod() throws Exception
    {
        String casingTest = TokenType.endToken;
        return casingTest;
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