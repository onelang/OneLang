class TestClass {
  testMethod() {
    throw new Error("exception message");
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}