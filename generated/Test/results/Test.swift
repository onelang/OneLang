class TestClass {
  func mapTest() -> Int {
      var mapObj: OneMap? = [
        "x": 5,
        "y": 3
      ]
      
      //let containsX = "x" in mapObj;
      mapObj!["z"] = 9
      mapObj!["x"] = nil
      
      let _: [String]? = Array(mapObj!.keys)
      let _: [Int]? = Array(mapObj!.values)
      return mapObj!["z"]!
  }

  func explicitTypeTest() -> Void {
      let op = ""
      print(op.count)
  }

  func ifTest(x: Int) -> String {
      var result = "<unk>"
      
      if x > 3 {
          result = "hello"
      } else if x < 1 {
          result = "bello"
      } else if x < 0 {
          result = "bello2"
      } else {
          result = "???"
      }
      
      if x > 3 {
          result = "z"
      }
      
      if x > 3 {
          result = "x"
      } else {
          result = "y"
      }
      
      return result
  }

  func arrayTest() -> Void {
      //const c2 = new Class2();
      
      var mutableArr: [Int]? = [1, 2]
      mutableArr!.append(3)
      mutableArr!.append(4)
      // mutableArr.push(c2.property);
      // mutableArr.push(c2.child.property);
      // mutableArr.push(c2.child.child.property);
      
      let constantArr: [Int]? = [5, 6]
      
      // some comment
      //   some comment line 2
      for item in mutableArr {
          print(item)
      }
      
      /* some other comment
         multiline and stuff
      */
      var i = 0
      while i < constantArr!.count {
          print(constantArr![i])
          i += 1
      }
  }

  func calc() -> Int {
      return (1 + 2) * 3
  }

  func methodWithArgs(arg1: Int, arg2: Int, arg3: Int) -> Int {
      let stuff = arg1 + arg2 + arg3 * self.calc()
      return stuff
  }

  func stringTest() -> String {
      let x = "x"
      let y = "y"
      
      var z = "z"
      z += "Z"
      z += x
      
      return z + "|" + x + y
  }

  func reverseString(str: String) -> String {
      var result = ""
      var i = str.count - 1
      while i >= 0 {
          result += String(str[str.index(str.startIndex, offsetBy: i)])
          i -= 1
      }
      return result
  }

  func getBoolResult(value: Bool) -> Bool {
      return value
  }

  func testMethod() -> Void {
      self.arrayTest()
      print(self.mapTest())
      print(self.stringTest())
      print(self.reverseString(str: "print value"))
      print(self.getBoolResult(value: true) ? "true" : "false")
  }
}

TestClass().testMethod()