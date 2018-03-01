///<reference path="../One.Core-v0.1/One.Core.d.ts" />

declare class OneJProperty {
    getName(): OneString;
    getValue(obj: OneJValue): OneJValue;
}

declare class OneJObject {
    getProperties(): OneArray<OneJProperty>;
    count(): OneNumber;
    names(): OneArray<OneString>;
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

    getArrayItems(): OneArray<OneJValue>;
}

declare class OneJson {
    static parse(str: string): OneJValue;
}
