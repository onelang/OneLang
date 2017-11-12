class TestClass {
  func testMethod() -> Void {
      let str_val = "str"
      let num = 1337
      let b = true
      let result = "before \(str_val), num: \(num), true: \(b) after"
      print(result)
      print("before \(str_val), num: \(num), true: \(b) after")
      
      let result2 = "before " + str_val + ", num: " + num + ", true: " + b + " after"
      print(result2)
  }
}

TestClass().testMethod()