class TestClass {
  func testMethod() -> Void {
      let str = "ABCDEF"
      let t_a0_true = str[str.index(str.startIndex, offsetBy: 0) ..< str.endIndex].hasPrefix("A")
      let t_a1_false = str[str.index(str.startIndex, offsetBy: 1) ..< str.endIndex].hasPrefix("A")
      let t_b1_true = str[str.index(str.startIndex, offsetBy: 1) ..< str.endIndex].hasPrefix("B")
      let t_c_d2_true = str[str.index(str.startIndex, offsetBy: 2) ..< str.endIndex].hasPrefix("CD")
      print("\(t_a0_true) \(t_a1_false) \(t_b1_true) \(t_c_d2_true)")
  }
}

TestClass().testMethod()