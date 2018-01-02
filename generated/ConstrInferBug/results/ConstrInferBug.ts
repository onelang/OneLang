class TestClass {
  methodTest(methodParam: OneArray) {
  }
  
  testMethod() {
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}