class NumberUnaryIssue {
    public void test(int num) throws Exception
    {
        num--;
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}