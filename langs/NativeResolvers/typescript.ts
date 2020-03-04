/// <reference path="../../packages/interfaces/One.Core-v0.1/index.d.ts" />
/// <reference path="../../packages/interfaces/One.Console-v0.1/index.d.ts" />

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

    get length(): OneNumber { return this._one.length; }

    push(item: T): void {
        this._one.add(item);
    }

    get(index: number): T {
        return this._one.get(index);
    }

    set(index: number, value: T): void {
        return this._one.set(index, value);
    }

    concat(arr2: T[]): T[] { return null; }
    join(separator: string): string { return ""; }
}

class TsMap<K,V> {
    _one: OneMap<K,V>;

    get(key: K): V {
        return this._one.get(key);
    }

    set(key: K, value: V): void {
        this._one.set(key, value);
    }

    delete(key: K): void {
        this._one.remove(key);
    }
}

class Map<K,V> {
    
}

class TsString {
    _one: OneString;
    
    get length(): OneNumber {
        return this._one.length;
    }

    get(idx: number): OneCharacter {
        return this._one.get(idx);
    }
    
    substring(start: number, end: number): OneString {
        return this._one.substring(start, end);
    }

    substr(start: number, length: number): OneString {
        return this._one.substring(start, start + length);
    }

    split(separator: string): OneArray<OneString> {
        return this._one.split(separator);
    }

    startsWith(str: string, position: number = 0): OneBoolean {
        return this._one.substrMatch(str, position);
    }

    endsWith(str: string): boolean { return false; }
}

class TsNumber {
    _one: OneNumber;
}

class TsCharacter {
    _one: OneCharacter;
}

class TsBoolean {
    _one: OneBoolean;
}

class Error {
    constructor(msg: string) { 
        OneError.raise(msg);
    }
}

class Promise<T> {

}

class RegExp {
    constructor(pattern: string, modifiers: string) {}
}

class RegExpExecArray { }
class Function { } // TODO: ???
class Array { }
class Math { }
class YAML { }
class Set<T> { }
class IterableIterator { }

function parseInt() { }
function import_() { }