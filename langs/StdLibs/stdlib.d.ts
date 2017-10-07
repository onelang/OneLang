declare class OneConsole {
    static print(str: any);
}

declare class OneArray<T> {
    length: number;
    add(item: T);
}

declare class OneMap<K, V> {
    keys(): OneArray<K>;
    values(): OneArray<V>;
    hasKey(keyName: string): boolean;
}
