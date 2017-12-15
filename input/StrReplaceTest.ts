class TestClass {
    testMethod() {
        const str = "A x B x C x D";
        const result = str.replace("x", "y");
        console.log(`R: ${result}, O: ${str}`);
    }
}