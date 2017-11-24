class ArrayTestClass {
    public void arrayTest() throws Exception
    {
        List<int> constant_arr = new ArrayList<int>(Arrays.asList(5));
        return constant_arr.size();
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}