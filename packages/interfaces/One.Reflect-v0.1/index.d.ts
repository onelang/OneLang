
declare class OneReflect {
    static getClass(obj: any): OneClass;
    static getClassByName(name: any): OneClass;
    static publish(): OneClass;
}

declare class OneClass {
    name: string;

    getField(name: string): OneField;
    getMethod(name: string): OneMethod;

    getFields(): OneArray<OneField>;
    getMethods(): OneArray<OneMethod>;
}

declare class OneField {
    name: string;
    isStatic: boolean;

    getValue(obj: any): any;
    setValue(obj: any, value: any): void;
}

declare class OneMethod {
    name: string;
    isStatic: boolean;

    call(obj: any, args: any[]): any;
}
