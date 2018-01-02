class TestClass {
  testMethod() {
    console.log("Hello world!");
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}