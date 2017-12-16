class TestClass {
  func testMethod() -> Void {
      let constant_arr = [5]
      
      var mutable_arr = [1]
      mutable_arr.append(2)
      
      print("len1: \(constant_arr.count), len2: \(mutable_arr.count)")
  }
}

TestClass().testMethod()