const YAML = require('js-yaml');

class YamlValue {
    constructor(value) { this.value = value; }
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

exports.YamlValue = YamlValue;
exports.OneYaml = OneYaml;