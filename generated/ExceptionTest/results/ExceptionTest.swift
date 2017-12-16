class TestClass {
  func notThrows() -> Int {
      return 5
  }

  func fThrows() throws -> Void {
      throw OneError.RuntimeError("exception message")
  }

  func testMethod() throws -> Void {
      print(self.notThrows())
      try self.fThrows()
  }
}

do {
    try TestClass().testMethod()
} catch OneError.RuntimeError(let message) {
    print("Exception: \(message)");
}