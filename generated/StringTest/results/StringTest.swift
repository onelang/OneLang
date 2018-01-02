class TestClass {
  func testMethod() -> String {
      let x = "x"
      let y = "y"
      
      var z = "z"
      z += "Z"
      z += x
      
      let a = String("abcdef"["abcdef".index("abcdef".startIndex, offsetBy: 2) ..< "abcdef".index("abcdef".startIndex, offsetBy: 4)])
      let arr: [String]? = "ab  cd ef".split(separator: " ", omittingEmptySubsequences: false)
      
      return z + "|" + x + y + "|" + a + "|" + arr![2]
  }
}

TestClass().testMethod()