import Foundation

class TestClass {
  func testMethod() -> String {
      let file_content = try! String(contentsOfFile: "../../input/test.txt", encoding: String.Encoding.utf8)
      return file_content
  }
}

TestClass().testMethod()