class List<T> {
    items: T[];
}

class Item {
    offset = 5;
    strTest = 'test' + 'test2';
    constructor(public strConstr = "constr") { }
}

class Container {
    itemList: List<Item>;
    stringList: List<string>;

    method0(){}
    method1(str = "x"){ return str; }
}