class TestClass {
  func testMethod() -> Void {
      let a = true
      let b = false
      let c = a && b
      let d = a || b
      print("a: \(a), b: \(b), c: \(c), d: \(d)")
  }
}

TestClass().testMethod()