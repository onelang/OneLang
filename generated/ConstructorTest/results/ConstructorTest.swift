class ConstructorTest {
  var field2: Int
  var field1: Int

  init(field1: Int) {
      self.field1 = field1
      self.field2 = field1 * self.field1 * 5
  }
}

class TestClass {
  func testMethod() -> Void {
      let test: ConstructorTest? = ConstructorTest(field1: 3)
      print(test!.field2)
  }
}

TestClass().testMethod()