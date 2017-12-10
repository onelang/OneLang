enum OneError : Error {
    case RuntimeError(String)
}

class TestClass {
  func testMethod() -> Void {
      throw OneError.RuntimeError("exception message")
  }
}

do {
    TestClass().testMethod()
} catch OneError.RuntimeError(let message) {
    print("Exception: \(message)");
}