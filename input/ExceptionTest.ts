class TestClass {
    notThrows(): number { return 5; }
    fThrows() { OneError.raise("exception message"); }
    testMethod() {
        console.log(this.notThrows());
        this.fThrows();
        //OneError.raise("exception message");
    }
}
