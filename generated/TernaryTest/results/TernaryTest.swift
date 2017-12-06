class TestClass {
  func getResult() -> Bool {
      return true
  }

  func testMethod() -> Void {
      print(self.getResult() ? "true" : "false")
  }
}

TestClass().testMethod()