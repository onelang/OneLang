declare class OneConsole {
    static print(str: any);
}

declare class OneArray<T> {
    length: number;
    add(item: T);
    get(index: number);
    set(index: number, value: T);
}

declare class OneMap<K, V> {
    get(key: K): V;
    set(key: K, value: V);
    remove(key: K);

    hasKey(key: K): boolean;

    keys(): OneArray<K>;
    values(): OneArray<V>;
}

declare class OneString {
    length: number;
}

declare class OneNumber {
}

declare class OneBoolean {
}