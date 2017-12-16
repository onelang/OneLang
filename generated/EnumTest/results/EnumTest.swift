enum TestEnum {
    case item1, item2
}

class TestClass {
  func testMethod() -> Void {
      var enum_v = TestEnum.item1
      if 3 * 2 == 6 {
          enum_v = TestEnum.item2
      }
      
      let check1 = enum_v == TestEnum.item2 ? "SUCCESS" : "FAIL"
      let check2 = enum_v == TestEnum.item1 ? "FAIL" : "SUCCESS"
      
      print("Item1: \(TestEnum.item1), Item2: \(enum_v), checks: \(check1) \(check2)")
  }
}

TestClass().testMethod()