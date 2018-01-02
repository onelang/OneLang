class List {
  items: OneArray;
}

class Item {
  offset: number = 5;
  strTest: string = "test" + "test2";
  strConstr: string = "constr";

  constructor(str_constr: string) {
      this.strConstr = str_constr;
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