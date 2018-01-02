enum SomeKind {
    case enumVal0, enumVal1, enumVal2
}

class TestClass {
  var enumField: SomeKind = SomeKind.enumVal2

  func testMethod() -> Void {
      print("Value: \(self.enumField)")
  }
}

TestClass().testMethod()