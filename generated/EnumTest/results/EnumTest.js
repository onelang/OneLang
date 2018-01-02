const TestEnum = Object.freeze({
  ITEM1: "Item1",
  ITEM2: "Item2",
});

class TestClass {
  testMethod() {
    let enumV = TestEnum.ITEM1;
    if (3 * 2 == 6) {
        enumV = TestEnum.ITEM2;
    }
    
    const check1 = enumV == TestEnum.ITEM2 ? "SUCCESS" : "FAIL";
    const check2 = enumV == TestEnum.ITEM1 ? "FAIL" : "SUCCESS";
    
    console.log(`Item1: ${TestEnum.ITEM1}, Item2: ${enumV}, checks: ${check1} ${check2}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}