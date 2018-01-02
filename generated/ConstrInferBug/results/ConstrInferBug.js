class TestClass {
  methodTest(methodParam) {
  }
  
  testMethod() {
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}