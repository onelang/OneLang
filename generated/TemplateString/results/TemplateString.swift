class TestClass {
  func testMethod() -> Void {
      let strVal = "str"
      let num = 1337
      let b = true
      let result: Any? = "before \(strVal), num: \(num), true: \(b) after"
      print(result)
      print("before \(strVal), num: \(num), true: \(b) after")
      
      let result2 = "before " + strVal + ", num: " + num + ", true: " + b + " after"
      print(result2)
  }
}

TestClass().testMethod()