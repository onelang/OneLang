export declare enum ValueType { Null, Boolean, Number, String, Array, Object }

export declare class YamlValue {
    type(): ValueType;
    asStr(): string;

    obj(key: string): YamlValue;
    dbl(key: string): number;
    str(key: string): string;
    arr(key: string): YamlValue[];
    dict(key: string): { [name: string]: YamlValue };
    strArr(key: string): string[];
}

export declare class OneYaml {
    static load(content: string): YamlValue;
}