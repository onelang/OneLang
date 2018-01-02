enum SomeKind {
  EnumVal0 = "EnumVal0",
  EnumVal1 = "EnumVal1",
  EnumVal2 = "EnumVal2",
}

class TestClass {
  enumField: SomeKind = SomeKind.EnumVal2;

  testMethod() {
    console.log(`Value: ${this.enumField}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}