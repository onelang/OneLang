export class Regex {
    static matchFromIndex(pattern: string, input: string, offset: number) {
        const regex = new RegExp(pattern, "gy");
        regex.lastIndex = offset;
        const matches = regex.exec(input);
        return matches === null ? null : Array.from(matches);
    }
}

export class Reflect {
    static classes: { [name: string]: Class } = {};
    
    static getClass(obj: any): Class { return this.classes[obj.constructor.name.toLowerCase()]; }
    static getClassByName(name: string): Class { return this.classes[name.toLowerCase()]; }

    static setupClass(cls: Class) { this.classes[cls.name.toLowerCase()] = cls; }
}

export class Class {
    name: string;

    fields: { [name: string]: Field; } = {};
    methods: { [name: string]: Method; } = {};

    constructor(public typeObj: any, fields: Field[], methods: Method[]) {
        this.name = typeObj.name;

        for (const field of fields) {
            field.cls = this;
            this.fields[field.name.toLowerCase()] = field;
        }

        for (const method of methods) {
            method.cls = this;
            this.methods[method.name.toLowerCase()] = method;
        }
    }

    getField(name: string) { return this.fields[name.toLowerCase()]; }
    getMethod(name: string) { return this.methods[name.toLowerCase()]; }

    getFields() { return Object.values(this.fields); }
    getMethods() { return Object.values(this.methods); }
}

export class Field {
    cls: Class;

    constructor(public name: string, public isStatic: boolean, public type: string) { }

    getValue(obj: any) {
        const realObj = this.isStatic ? this.cls.typeObj : obj;
        return realObj[this.name];
    }

    setValue(obj: any, value: any){
        const realObj = this.isStatic ? this.cls.typeObj : obj;
        realObj[this.name] = value;
    }
}

export class Method {
    cls: Class;

    constructor(public name: string, public isStatic: boolean, public returnType: string, public args: MethodArgument[]) { }

    call(obj: any, args: any[]) {
        if (args.length !== this.args.length)
            throw new Error(`Expected ${this.args.length} arguments, but got ${args.length} in ${this.cls.name}::${this.name} call!`);

        const realObj = this.isStatic ? this.cls.typeObj : obj;
        const method = realObj[this.name]
        return method.apply(obj, args);
    }
}

export class MethodArgument {
    constructor(public name: string, public type: string) { }
}
