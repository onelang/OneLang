enum TestEnum {
    case item1, item2
}

class TestClass {
  func testMethod() -> Void {
      var enumV = TestEnum.item1
      if 3 * 2 == 6 {
          enumV = TestEnum.item2
      }
      
      let check1 = enumV == TestEnum.item2 ? "SUCCESS" : "FAIL"
      let check2 = enumV == TestEnum.item1 ? "FAIL" : "SUCCESS"
      
      print("Item1: \(TestEnum.item1), Item2: \(enumV), checks: \(check1) \(check2)")
  }
}

TestClass().testMethod()