import java.nio.file.Paths;
import java.nio.file.Files;

class TestClass {
    public String testMethod() throws Exception
    {
        String fileContent = new String(Files.readAllBytes(Paths.get("../../input/test.txt")));;
        return fileContent;
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