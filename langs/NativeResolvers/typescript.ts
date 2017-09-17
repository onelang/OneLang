//// <reference path="../StdLibs/typescript.d.ts" />

class console {
    static log(data: any) {
        one.Console.print(data);
    }
}

class TsArray<T> {
    _one: one.Array<T>;

    get length(): number { return this._one.length; }

    push(item: T) {
        this._one.add(item);
    }
}
