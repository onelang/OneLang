class TestClass {
  public getResult() {
    return true;
  }
  
  public testMethod() {
    console.log(this.getResult() ? "true" : "false");
  }
}

new TestClass().testMethod();