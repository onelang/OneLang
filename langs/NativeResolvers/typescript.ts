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
    static keys<T>(map: { [name: string]: T }): string[] {
        return map.keys();
    }

    static values<T>(map: { [name: string]: T }): T[] {
        return map.values();
    }
}

class TsArray<T> {
    get length(): number { return this._one.length; }

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
    map<T2>(selector: (item: T) => T2) { return null; }
}

class TsMap<K,V> {
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
    _one: string;
    
    get length(): number {
        return this._one.length;
    }

    get(idx: number): string {
        return this._one.get(idx);
    }
    
    substring(start: number, end: number): string {
        return this._one.substring(start, end);
    }

    substr(start: number, length: number): string {
        return this._one.substring(start, start + length);
    }

    split(separator: string): string[] {
        return this._one.split(separator);
    }

    startsWith(str: string, position: number = 0): boolean {
        return this._one.substrMatch(str, position);
    }

    endsWith(str: string): boolean { return false; }
    replace(from: string, to: string): string { return ""; }
}

class TsNumber {
}

class TsBoolean {
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

class JSON {
    stringify(obj: any): string { return null; }
}
