/// <reference path="../../packages/interfaces/One.Core-v0.1/index.d.ts" />
/// <reference path="../../packages/interfaces/One.Console-v0.1/index.d.ts" />

declare class console {
    static log(data: any);
}

declare class Object {
    static keys<T>(map: { [name: string]: T }): string[];
    static values<T>(map: { [name: string]: T }): T[];
}

declare class TsArray<T> {
    get length(): number;
    push(item: T): void;
    get(index: number): T;
    set(index: number, value: T): void;
    concat(arr2: T[]): T[];
    join(separator: string): string;
    map<T2>(selector: (item: T) => T2): T2[];
}

declare class TsMap<V> {
    get(key: string): V;
    set(key: string, value: V): void;
    delete(key: string): void;
    hasKey(key: string): boolean;
}

declare class Map<K, V> {
}

declare class TsString {
    get length(): number;
    get(idx: number): string;
    substring(start: number, end: number): string;
    substr(start: number, length: number): string;
    split(separator: string): string[];
    startsWith(str: string, position: number): boolean;
    endsWith(str: string): boolean;
    replace(from: string, to: string): string;
    repeat(count: number): string;
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

declare class JSON {
    stringify(obj: any): string;
}
