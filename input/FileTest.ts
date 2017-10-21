class TestClass {
    testMethod(): string {
        const fileContent = OneFile.readText("../../input/test.txt");
        return fileContent;
    }
}
