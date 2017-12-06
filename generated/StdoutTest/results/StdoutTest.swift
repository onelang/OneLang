class TestClass {
  func reverseString(str: String) -> String {
      var result = ""
      var i = str.count - 1
      while i >= 0 {
          result += String(str[str.index(str.startIndex, offsetBy: i)])
          i -= 1
      }
      return result
  }

  func testMethod() -> String {
      print(self.reverseString(str: "print value"))
      return "return value"
  }
}

TestClass().testMethod()