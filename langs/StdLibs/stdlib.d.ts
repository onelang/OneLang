declare class OneConsole {
    static print(str: any);
}

declare class OneFile {
    static readText(fn: string): OneString;
}

declare class OneArray<T> {
    length: number;
    add(item: T);
    get(index: number): T;
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
    static raise(message: string);
}

declare class OneRegex {
    static matchFromIndex(pattern: string, input: string, offset: number): OneArray<OneString>;
}

//=== REFLECTION

declare class OneReflect {
    static classes: OneMap<string, OneReflectClass>;
    static getClass(obj: any): OneReflectClass;
}

declare class OneReflectClass {
    name: string;
    fields: OneMap<string, OneReflectField>;
    methods: OneMap<string, OneReflectMethod>;
}

declare class OneReflectField {
    name: string;
    isStatic: boolean;

    getValue(obj: any);
    setValue(obj: any, value: any);
}

declare class OneReflectMethod {
    name: string;
    isStatic: boolean;
    call(obj: any, args: any[]);
}

//===