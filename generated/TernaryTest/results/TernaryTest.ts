class TestClass {
  public getResult() {
    return true;
  }
  
  public testMethod() {
    console.log(this.getResult() ? "true" : "false");
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}