class TestClass {
  testMethod() {
    const str = "A x B x C x D";
    const result = str.split("x").join("y");
    console.log(`R: ${result}, O: ${str}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}