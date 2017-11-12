class List {
  var items: []
}

class Item {
  var offset: Int = 5
  var str_test: String = "test" + "test2"
  var str_constr: String = "constr"

  init(str_constr: String) {
      self.str_constr = str_constr
  }
}

class Container {
  var item_list: List
  var string_list: Listfunc method0() -> Void {
      
  }
  
  func method1(str: String) -> Void {
      return str
  }
}

TestClass().testMethod()