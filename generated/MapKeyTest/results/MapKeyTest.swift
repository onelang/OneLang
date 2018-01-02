class TestClass {
  func testMethod() -> Void {
      let map: OneMap? = [
      ]
      let _: [String]? = Array(map!.keys)
  }
}

TestClass().testMethod()