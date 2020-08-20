import { OneYaml } from "One.Yaml-v0.1";

// @external
export class YamlValue {
    constructor(public value: { [key: string]: any }) { }
    obj(key: string): YamlValue { return new YamlValue(this.value[key]); }
    dbl(key: string): number { return this.value[key] || 0; }
    str(key: string): string { return this.value[key] || null; }
    arr(key: string): YamlValue[] { return (this.value[key] || []).map(x => new YamlValue(x)); }
    strArr(key: string): string[] { return this.value[key] || []; }
}

// @external
export class Yaml {
    static load(content: string): YamlValue {
        return new YamlValue(YAML.safeLoad(content));
    }
}