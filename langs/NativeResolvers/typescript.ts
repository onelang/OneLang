//// <reference path="../StdLibs/typescript.d.ts" />

class OneConsole {
    static print(str: any) { }
}

class OneArray<T> {
    length: number;
    add(item: T) { }
}

class console {
    static log(data: any) {
        OneConsole.print(data);
    }
}

class Object {
    static keys() { }
    static values() { }
}

class TsArray<T> {
    _one: OneArray<T>;

    get length(): number { return this._one.length; }

    push(item: T) {
        this._one.add(item);
    }
}
