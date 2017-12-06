class TestClass {
  testMethod() {
    const a = true;
    const b = false;
    const c = a && b;
    const d = a || b;
    console.log(`a: ${a}, b: ${b}, c: ${c}, d: ${d}`);
  }
}

new TestClass().testMethod();