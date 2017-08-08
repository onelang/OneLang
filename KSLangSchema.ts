export namespace KSLangSchema {
    export interface SchemaFile {
        enums: { [name: string]: Enum };
        classes: { [name: string]: Class };
    }

    export interface Enum {
        name?: string;
        values: EnumMember[];
    }

    export interface EnumMember {
        name: string;
    }

    export interface Class {
        name?: string;
        fields: { [name: string]: Field };
        constructor: Constructor;
        methods: { [name: string]: Method };
    }

    export enum Visibility { Public = "public", Protected = "protected", Private = "private" }
    
    export enum PrimitiveType { 
        Void = "void",
        Boolean = "boolean",
        Array = "array",
        String = "string",
        Int32 = "int32",
        Class = "class"
    }

    export interface Type {
        type: PrimitiveType;
        className: string;
        typeArguments: Type[];
    }

    export interface VariableBase {
        name?: string;
        type: Type;
    }

    export interface Field extends VariableBase {
        visibility: Visibility;
        defaultValue: any;
    }

    export interface MethodParameter extends VariableBase { }

    export interface Constructor {
        parameters: MethodParameter[];
    }

    export interface Method {
        name?: string;
        parameters: MethodParameter[];
        returns: Type;
    }
}
