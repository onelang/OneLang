class List<T> {
    items: T[];
}

class Item {
    offset: number = 5;
    strTest: string = 'test' + 'test2';
    constructor(public strConstr: string = "constr") { }
}

class Container {
    itemList: List<Item>;
    stringList: List<string>;

    method0(){}
    method1(str: string = "x"){ return str; }
}

console.log("ok");