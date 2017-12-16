class ConstructorTest {
  constructor(field1) {
      this.field1 = field1;
      this.field2 = field1 * this.field1 * 5;
  }
}

class TestClass {
  testMethod() {
    const test = new ConstructorTest(3);
    console.log(test.field2);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}