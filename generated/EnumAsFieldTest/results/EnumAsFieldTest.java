enum SomeKind { ENUM_VAL0, ENUM_VAL1, ENUM_VAL2 };

class TestClass {
    public SomeKind enumField = SomeKind.ENUM_VAL2;

    public void testMethod() throws Exception
    {
        System.out.println("Value: " + this.enumField);
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