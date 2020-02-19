declare class OneArray<T> {
    length: number;
    add(item: T): void;
    get(index: number): T;
    set(index: number, value: T): void;
}

declare class OneMap<K, V> {
    get(key: K): V;
    set(key: K, value: V): void;
    remove(key: K): void;

    hasKey(key: K): boolean;

    keys(): OneArray<K>;
    values(): OneArray<V>;
}

declare class OneCharacter {
}

declare class OneString {
    length: OneNumber;
    substring(start: number, end: number): OneString;
    split(separator: string): OneArray<OneString>;
    get(idx: number): OneCharacter;
    startsWith(str: string): OneBoolean;
    substrMatch(str: string, offset: number): OneBoolean;
    replace(from: string, to: string): OneString;
}

declare class OneNumber {
}

declare class OneBoolean {
}

declare class OneError {
    static raise(message: string): void;
}

declare class One {
    static langName(): OneString;
}