enum TestEnum { ITEM1, ITEM2 };

class TestClass {
    public void testMethod() throws Exception
    {
        TestEnum enumV = TestEnum.ITEM1;
        if (3 * 2 == 6) {
            enumV = TestEnum.ITEM2;
        }
        
        String check1 = enumV == TestEnum.ITEM2 ? "SUCCESS" : "FAIL";
        String check2 = enumV == TestEnum.ITEM1 ? "FAIL" : "SUCCESS";
        
        System.out.println("Item1: " + TestEnum.ITEM1 + ", Item2: " + enumV + ", checks: " + check1 + " " + check2);
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