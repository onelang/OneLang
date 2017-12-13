enum OneError : Error {
    case RuntimeError(String)
}

class TestClass {
  func testMethod() throws -> Void {
      throw OneError.RuntimeError("exception message")
  }
}

do {
    try TestClass().testMethod()
} catch OneError.RuntimeError(let message) {
    print("Exception: \(message)");
}