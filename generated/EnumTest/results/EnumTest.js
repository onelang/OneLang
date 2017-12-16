const TestEnum = Object.freeze({
  ITEM1: "Item1",
  ITEM2: "Item2",
});

class TestClass {
  testMethod() {
    let enum_v = TestEnum.ITEM1;
    if (3 * 2 == 6) {
        enum_v = TestEnum.ITEM2;
    }
    
    const check1 = enum_v == TestEnum.ITEM2 ? "SUCCESS" : "FAIL";
    const check2 = enum_v == TestEnum.ITEM1 ? "FAIL" : "SUCCESS";
    
    console.log(`Item1: ${TestEnum.ITEM1}, Item2: ${enum_v}, checks: ${check1} ${check2}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}