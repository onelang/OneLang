class TestClass {
  public methodTest(method_param: OneArray) {
  }
  
  public testMethod() {
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}