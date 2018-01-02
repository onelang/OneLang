class TestClass {
  testMethod() {
    const op = null;
    console.log(op.length);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}