class TestClass {
    getResult(): boolean { return true; }

    testMethod() {
        console.log(this.getResult() ? "true" : "false");
    }
}