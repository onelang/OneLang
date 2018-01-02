class TestClass {
  testMethod() {
    const map = {
    };
    const keys = Object.keys(map);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}