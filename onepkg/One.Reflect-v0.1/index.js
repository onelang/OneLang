class ReflectedValue {
    constructor(value, declaredType) {
        this.value = value;
        this.declaredType = declaredType;
    }

    getField(name) {
        return new ReflectedValue(this.value[name], this.declaredType.decl.fields.find(x => x.name === name).type);
    }

    getArrayItems() {
        return this.value.map(x => new ReflectedValue(x, this.declaredType.typeArguments[0]));
    }

    getMapKeys() {
        return Object.keys(this.value);
    }

    getMapValue(name) {
        return new ReflectedValue(this.value[name], this.declaredType.typeArguments[0]);
    }

    getEnumValueAsString() {
        return this.declaredType.decl.values[this.value].name;
    }

    getBooleanValue() { return this.value; }
    getStringValue() { return this.value; }
    isNull() { return this.value === null; }
    getUniqueIdentifier() { return this.value; }

    getDeclaredType() { return this.declaredType; }
    getValueType() { 
        if (typeof this.valueType === "undefined")
            this.valueType = typeof value === "object" ? Reflection.getClassType(value.__proto__.constructor) : null
        return this.valueType;
    }
}

class Reflection {
    static registerClass(cls, type) { this.classTypes[cls] = type; }
    
    static getClassType(cls) { 
        if (!(cls in this.classTypes))
            throw new Error(`Class was not registered for Reflection: ${cls.name}`);

        return this.classTypes[cls];
    }

    static wrap(value, declaredType) { return new ReflectedValue(value, declaredType); }
}
Reflection.classTypes = {};

exports.ReflectedValue = ReflectedValue;
exports.Reflection = Reflection;
