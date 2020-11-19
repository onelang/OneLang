class OneJObject {
    constructor(value) { this.value = value; }

    names() { return Object.keys(this.value); }
    get(name) { return new OneJValue(this.value[name]); }
}

class OneJValue {
    constructor(value) { this.value = value; }

    isObject() { return typeof this.value === "object" && !Array.isArray(this.value); }
    isArray() { return Array.isArray(this.value); }
    isString() { return typeof this.value === "string"; }
    isNumber() { return typeof this.value === "number"; }
    isBool() { return typeof this.value === "boolean"; }
    isNull() { return this.value === null; }

    asString() { return this.value; }
    asNumber() { return this.value; }
    asBool() { return this.value; }
    asObject() { return new OneJObject(this.value); }

    getArrayItems() { return this.value.map(x => new OneJValue(x)); }
}

class OneJson {
    static parse(content) {
        return new OneJValue(JSON.parse(content));
    }
}

exports.OneJson = OneJson;