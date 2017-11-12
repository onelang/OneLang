class ConstructorTest {
  public field2: number;
  public field1: number;

  constructor(field1: number) {
      this.field1 = field1;
      this.field2 = field1 * this.field1 * 5;
  }
}

class TestClass {
  public testMethod() {
    const test = new ConstructorTest(3);
    console.log(test.field2);
  }
}

new TestClass().testMethod();