class TestClass {
  func testMethod() -> Void {
      let constantArr: [Int]? = [5]
      
      var mutableArr: [Int]? = [1]
      mutableArr!.append(2)
      
      print("len1: \(constantArr!.count), len2: \(mutableArr!.count)")
  }
}

TestClass().testMethod()