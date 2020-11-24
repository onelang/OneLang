const YAML = require('js-yaml');

const ValueType = { Null: 0, Boolean: 1, Number: 2, String: 3, Array: 4, Object: 5 };

class YamlValue {
    constructor(value) { this.value = value; }
    
    type() { 
        const t = typeof(this.value);
        return this.value === null ? 0 : 
            t === "boolean" ? 1 : 
            t === "number" ? 2 :
            t === "string" ? 3 :
            Array.isArray(this.value) ? 4 : 5; }
    asStr() { return this.value; }

    obj(key) { return new YamlValue(this.value[key]); }
    dbl(key) { return this.value[key] || 0; }
    str(key) { return this.value[key] || null; }
    arr(key) { return (this.value[key] || []).map(x => new YamlValue(x)); }
    dict(key) { return Object.fromEntries(Object.entries(this.value[key] || {}).map(([key,value]) => [key, new YamlValue(value)])); }
    strArr(key) { return this.value[key] || []; }
}

class OneYaml {
    static load(content) {
        return new YamlValue(YAML.safeLoad(content));
    }
}

exports.ValueType = ValueType;
exports.YamlValue = YamlValue;
exports.OneYaml = OneYaml;