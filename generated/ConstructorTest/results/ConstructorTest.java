class ConstructorTest {
    public Integer field2;
    public Integer field1;

    public ConstructorTest(Integer field1) throws Exception {
        this.field1 = field1;
        this.field2 = field1 * this.field1 * 5;
    }
}

class TestClass {
    public void testMethod() throws Exception
    {
        ConstructorTest test = new ConstructorTest(3);
        System.out.println(test.field2);
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