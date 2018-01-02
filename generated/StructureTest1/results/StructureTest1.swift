class List {
  var items: []?
}

class Item {
  var offset: Int = 5
  var strTest: String = "test" + "test2"
  var strConstr: String = "constr"

  init(strConstr: String) {
      self.strConstr = strConstr
  }
}

class Container {
  var itemList: List?
  var stringList: List?

  func method0() -> Void {
  }

  func method1(str: String) -> Void {
      return str
  }
}