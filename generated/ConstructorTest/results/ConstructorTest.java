class ConstructorTest {
    public int field2;
    public int field1;

    public ConstructorTest(int field1) {
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
        new TestClass().testMethod();
    }
}