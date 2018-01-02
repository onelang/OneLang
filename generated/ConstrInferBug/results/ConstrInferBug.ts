class TestClass {
  methodTest(method_param: OneArray) {
  }
  
  testMethod() {
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}