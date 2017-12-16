class TestClass {
  testMethod() {
    const result = [];
    const map = {
      x: 5
    };
    const keys = Object.keys(map);
    console.log(result);
    console.log(keys);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}