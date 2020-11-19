export declare class OneJProperty {
    getName(): string;
    getValue(obj: OneJValue): OneJValue;
}

export declare class OneJObject {
    //getProperties(): OneJProperty[];
    names(): string[];
    get(name: string): OneJValue;
}

export declare class OneJValue {
    isObject(): boolean;
    isArray(): boolean;
    isString(): boolean;
    isNumber(): boolean;
    isBool(): boolean;
    isNull(): boolean;

    asString(): string;
    asNumber(): number;
    asBool(): boolean;
    asObject(): OneJObject;

    getArrayItems(): OneJValue[];
}

export declare class OneJson {
    static parse(str: string): OneJValue;
    static deserialize<T>(str: string): T;
}
