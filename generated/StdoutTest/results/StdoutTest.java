class TestClass {
    public String reverseString(String str) throws Exception
    {
        String result = "";
        for (Integer i = str.length() - 1; i >= 0; i--) {
            result += str.charAt(i);
        }
        return result;
    }
    
    public String testMethod() throws Exception
    {
        System.out.println(this.reverseString("print value"));
        return "return value";
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