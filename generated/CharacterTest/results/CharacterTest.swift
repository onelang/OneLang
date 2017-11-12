class TestClass {
  func testMethod() -> Void {
      let str = "a1A"
      var i = 0
      while i < str.count {
          let c = String(str[str.index(str.startIndex, offsetBy: i)])
          let is_upper = "A" <= c && c <= "Z"
          let is_lower = "a" <= c && c <= "z"
          let is_number = "0" <= c && c <= "9"
          print(is_upper ? "upper" : is_lower ? "lower" : is_number ? "number" : "other")
          i += 1
      }
  }
}

TestClass().testMethod()