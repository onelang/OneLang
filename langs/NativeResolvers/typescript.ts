/// <reference path="../../packages/interfaces/One.Core-v0.1/index.d.ts" />
/// <reference path="../../packages/interfaces/One.Console-v0.1/index.d.ts" />

declare class console {
    static log(data: any): void;
    static error(data: any): void;
}

declare class Object {
    static keys<T>(map: { [name: string]: T }): string[];
    static values<T>(map: { [name: string]: T }): T[];
    hasKey(name: string): boolean;
    get(propName: string): any;
    toString(): string;
}

declare class TsArray<T> {
    get length(): number;
    push(item: T): void;
    get(index: number): T;
    set(index: number, value: T): void;
    concat(arr2: T[]): T[];
    join(separator: string): string;
    map<T2>(selector: (item: T) => T2): T2[];
    find(predicate: (value: T) => boolean): T;
    shift(): T;
    includes(item: T): boolean;
    pop(): T;
    filter(predicate: (item: T) => boolean): T[];
    slice(num: number): T[];
    some(predictate: (item: T) => boolean): boolean;
    every(predictate: (item: T, index: number) => boolean): boolean;
    splice(start: number, deleteCount: number): void;
    sort(func: (a: T, b: T) => number): T[];
    reduce<TAcc>(func: (acc: TAcc, val: T) => TAcc, initVal: TAcc): TAcc;
}

declare class TsMap<V> {
    get(key: string): V;
    set(key: string, value: V): void;
    delete(key: string): void;
    hasKey(key: string): boolean;
}

declare interface IterableIterator<T> {

}

declare class Map<K, V> {
    get(key: K): V;
    set(key: K, value: V): void;
    delete(key: K): void;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
}

declare class TsString {
    get length(): number;
    get(idx: number): string;
    substring(start: number, end: number): string;
    substr(start: number): string;
    substr(start: number, length: number): string;
    split(separator: RegExp): string[];
    startsWith(str: string): boolean;
    startsWith(str: string, position: number): boolean;
    endsWith(str: string): boolean;
    replace(from: RegExp, to: string): string;
    repeat(count: number): string;
    match(pattern: RegExp): boolean;
    trim(): string;
    charAt(idx: number): string;
    includes(str: string): boolean;
    indexOf(pattern: string): number;
    indexOf(pattern: string, startIdx: number): number;
    lastIndexOf(pattern: string): number;
    lastIndexOf(pattern: string, startIdx: number): number;
    toUpperCase(): string;
    toLowerCase(): string;
    slice(offset: number): string;
}

class TsNumber {
}

class TsBoolean {
}

class Error {
    static stackTraceLimit: number;
    stack: string;

    constructor(msg: string) { 
        OneError.raise(msg);
    }
}

declare class Promise<T> {
    static resolve<T>(result: T): Promise<T>;
}

declare class RegExp {
    constructor(pattern: string, modifiers: string);
    lastIndex: number;
    exec(input: string): RegExpExecArray;
}

declare class RegExpExecArray {
    length: number;
    get(idx: number): string;
}

declare class Function {
    apply(thisObj: Object, args: any[]): any;
}

declare class Array {
    static isArray(obj: any): boolean;
    static from<T>(obj: IterableIterator<T>): T[];
}

declare class Math {
    static floor(num: number): number;
    static min(a: number, b: number): number;
}

declare class YAML {
    static safeLoad(data: string): any;
}

declare class Set<T> implements IterableIterator<T> {
    add(item: T): void;
    values(): IterableIterator<T>;
}

declare function parseInt(str: string): number;
declare function import_(): Promise<any>;

declare class JSON {
    static stringify(obj: any): string;
}
