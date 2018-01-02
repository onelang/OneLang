class TestClass {
  func testMethod() -> Void {
      let str = "a1A"
      var i = 0
      while i < str.count {
          let c = String(str[str.index(str.startIndex, offsetBy: i)])
          let isUpper = "A" <= c && c <= "Z"
          let isLower = "a" <= c && c <= "z"
          let isNumber = "0" <= c && c <= "9"
          print(isUpper ? "upper" : isLower ? "lower" : isNumber ? "number" : "other")
          i += 1
      }
  }
}

TestClass().testMethod()