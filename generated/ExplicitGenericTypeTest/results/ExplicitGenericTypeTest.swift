class TestClass {
  func testMethod() -> Void {
      let result = [String]()
      let map = [
        "x": 5
      ]
      let keys = Array(map.keys)
      print(result)
      print(keys)
  }
}

TestClass().testMethod()