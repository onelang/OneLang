class TestClass {
  func testMethod() -> Void {
      let str = "ABCDEF"
      let tA0True = String(str[str.index(str.startIndex, offsetBy: 0) ..< str.endIndex]).hasPrefix("A")
      let tA1False = String(str[str.index(str.startIndex, offsetBy: 1) ..< str.endIndex]).hasPrefix("A")
      let tB1True = String(str[str.index(str.startIndex, offsetBy: 1) ..< str.endIndex]).hasPrefix("B")
      let tCD2True = String(str[str.index(str.startIndex, offsetBy: 2) ..< str.endIndex]).hasPrefix("CD")
      print("\(tA0True) \(tA1False) \(tB1True) \(tCD2True)")
  }
}

TestClass().testMethod()