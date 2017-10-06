//// <reference path="../StdLibs/typescript.d.ts" />

class OneConsole {
    static print(str: any) { }
}

class OneArray<T> {
    length: number;
    add(item: T) { }
}

class OneMap<K,V> {
    keys(): K[] { return null; }
    values(): V[] { return null; }
}

class console {
    static log(data: any) {
        OneConsole.print(data);
    }
}

class Object {
    static keys<K,V>(map: OneMap<K,V>): K[] {
        return map.keys();
    }

    static values<K,V>(map: OneMap<K,V>): V[] {
        return map.values();
    }
}

class TsArray<T> {
    _one: OneArray<T>;

    get length(): number { return this._one.length; }

    push(item: T) {
        this._one.add(item);
    }
}

class TsMap<K,V> {
    _one: OneMap<K,V>;
}
