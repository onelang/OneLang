enum TestEnum {
  Item1 = "Item1",
  Item2 = "Item2",
}

class TestClass {
  testMethod() {
    let enum_v = TestEnum.Item1;
    if (3 * 2 == 6) {
        enum_v = TestEnum.Item2;
    }
    
    const check1 = enum_v == TestEnum.Item2 ? "SUCCESS" : "FAIL";
    const check2 = enum_v == TestEnum.Item1 ? "FAIL" : "SUCCESS";
    
    console.log(`Item1: ${TestEnum.Item1}, Item2: ${enum_v}, checks: ${check1} ${check2}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}