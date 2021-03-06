import { IType } from "One.Ast-v0.1";

export declare class ReflectedValue {
    getField(name: string): ReflectedValue;
    getArrayItems(): ReflectedValue[];
    getMapKeys(): string[];
    getMapValue(key: string): ReflectedValue;
    getEnumValueAsString(): string;
    getBooleanValue(): boolean;
    getStringValue(): string;
    isNull(): boolean;
    getUniqueIdentifier(): any;
    getValueType(): IType;
    getDeclaredType(): IType;
}
