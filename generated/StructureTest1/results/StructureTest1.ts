class List {
  public items: OneArray;
}

class Item {
  public offset: number = 5;
  public strTest: string = "test" + "test2";
  public strConstr: string = "constr";

  constructor(str_constr: string) {
      this.strConstr = str_constr;
  }
}

class Container {
  public itemList: List;
  public stringList: List;

  public method0() {
  }
  
  public method1(str: string) {
    return str;
  }
}

new TestClass().testMethod();