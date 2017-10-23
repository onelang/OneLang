/// <reference path="../StdLibs/stdlib.d.ts" />

class TsMapOperators {
    op_in<K,V>(left: K, right: TsMap<K,V>): boolean {
        return right._one.hasKey(left);
    }
}

class console {
    static log(data: any) {
        OneConsole.print(data);
    }
}

class Object {
    static keys<K,V>(map: OneMap<K,V>): OneArray<K> {
        return map.keys();
    }

    static values<K,V>(map: OneMap<K,V>): OneArray<V> {
        return map.values();
    }
}

class TsArray<T> {
    _one: OneArray<T>;

    get length(): number { return this._one.length; }

    push(item: T) {
        this._one.add(item);
    }

    get(index: number) {
        return this._one.get(index);
    }

    set(index: number, value: T) {
        return this._one.set(index, value);
    }
}

class TsMap<K,V> {
    _one: OneMap<K,V>;

    get(key: K) {
        this._one.get(key);
    }

    set(key: K, value: V) {
        this._one.set(key, value);
    }

    delete(key: K) {
        this._one.remove(key);
    }
}

class TsString {
    _one: OneString;
    
    get length(): OneNumber {
        return this._one.length;
    }

    get(idx: number): OneString {
        return this._one.get(idx);
    }
    
    substring(start: number, end: number): OneString {
        return this._one.substring(start, end);
    }

    split(separator: string): OneArray<OneString> {
        return this._one.split(separator);
    }

    startsWith(str: string): OneBoolean {
        return this._one.startsWith(str);
    }
}

class TsNumber {
    _one: OneNumber;
}

class TsBoolean {
    _one: OneBoolean;
}