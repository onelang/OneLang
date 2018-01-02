class List {
  items: OneArray;
}

class Item {
  offset: number = 5;
  strTest: string = "test" + "test2";
  strConstr: string = "constr";

  constructor(strConstr: string) {
      this.strConstr = strConstr;
  }
}

class Container {
  itemList: List;
  stringList: List;

  method0() {
  }
  
  method1(str: string) {
    return str;
  }
}