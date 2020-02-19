///<reference path="../One.Core-v0.1/index.d.ts" />

export declare class OneJProperty {
    getName(): OneString;
    getValue(obj: OneJValue): OneJValue;
}

export declare class OneJObject {
    getProperties(): OneArray<OneJProperty>;
    count(): OneNumber;
    names(): OneArray<OneString>;
    get(name: string): OneJValue;
}

export declare class OneJValue {
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

    getArrayItems(): OneArray<OneJValue>;
}

export declare class OneJson {
    static parse(str: string): OneJValue;
    static deserialize<T>(str: string): T;
}
