class TestClass {
  getResult() {
    return true;
  }
  
  testMethod() {
    console.log(this.getResult() ? "true" : "false");
  }
}

new TestClass().testMethod();