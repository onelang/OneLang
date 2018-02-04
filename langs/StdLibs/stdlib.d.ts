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
    static getClass(obj: any): OneClass;
    static getClassByName(name: any): OneClass;
}

declare class OneClass {
    name: string;

    getField(name: string): OneField;
    getMethod(name: string): OneMethod;

    getFields(): OneField[];
    getMethods(): OneMethod[];
}

declare class OneField {
    name: string;
    isStatic: boolean;

    getValue(obj: any): any;
    setValue(obj: any, value: any);
}

declare class OneMethod {
    name: string;
    isStatic: boolean;

    call(obj: any, args: any[]): any;
}

//===

declare class OneBigInteger {
    static fromInt(value: number): OneBigInteger;
}

declare class OneJProperty {
    getName(): OneString;
    getValue(obj: OneJValue): OneJValue;
}

declare class OneJObject {
    getProperties(): OneJProperty[];
    count(): OneNumber;
    names(): OneString[];
    get(name: string): OneJValue;
}

declare class OneJValue {
    isObject(): OneBoolean;
    isArray(): OneBoolean;
    isString(): OneBoolean;
    isNumber(): OneBoolean;
    isBool(): OneBoolean;
    isNull(): OneBoolean;

    asString(): OneString;
    asNumber(): OneNumber;
    asBool(): OneBoolean;
    asObject(): OneJObject;

    getArrayItems(): OneJValue[];
}

declare class OneJson {
    static parse(str: string): OneJValue;
}