const SomeKind = Object.freeze({
  ENUM_VAL0: "EnumVal0",
  ENUM_VAL1: "EnumVal1",
  ENUM_VAL2: "EnumVal2",
});

class TestClass {
  constructor() {
      this.enumField = SomeKind.ENUM_VAL2;
  }

  testMethod() {
    console.log(`Value: ${this.enumField}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}