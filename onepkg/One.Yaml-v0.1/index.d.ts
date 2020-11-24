export declare enum ValueType { Null = 0, Boolean = 1, Number = 2, String = 3, Array = 4, Object = 5 }

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