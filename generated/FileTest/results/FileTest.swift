import Foundation

class TestClass {
  func testMethod() -> String {
      let fileContent = try! String(contentsOfFile: "../../input/test.txt", encoding: String.Encoding.utf8)
      return fileContent
  }
}

TestClass().testMethod()