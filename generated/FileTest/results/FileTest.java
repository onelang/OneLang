import java.nio.file.Paths;
import java.nio.file.Files;

class TestClass {
    public String testMethod() throws Exception
    {
        String file_content = new String(Files.readAllBytes(Paths.get("../../input/test.txt")));;
        return file_content;
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}