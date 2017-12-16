import Foundation

class TestClass {
  func testMethod() -> Void {
      let str = "A x B x C x D"
      let result = str.replacingOccurrences(of: "x", with: "y")
      print("R: \(result), O: \(str)")
  }
}

TestClass().testMethod()