enum SomeKind {
    case enum_val0, enum_val1, enum_val2
}

class TestClass {
  var enum_field: SomeKind = SomeKind.enum_val2

  func testMethod() -> Void {
      print("Value: \(self.enum_field)")
  }
}

TestClass().testMethod()