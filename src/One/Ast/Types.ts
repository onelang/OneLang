import { Statement } from "./Statements";
import { Type } from "./AstTypes";
import { Expression } from "./Expressions";

export enum Visibility {
    Public = "public",
    Protected = "protected",
    Private = "private"
}

export interface IVariable {
    name: string;
    type: Type;
}

export interface IVariableWithInitializer extends IVariable {
    initializer: Expression;
}

export class SourceFile {
    constructor(
        public imports: Import[],
        public interfaces: { [name: string]: Interface },
        public classes: { [name: string]: Class },
        public enums: { [name: string]: Enum },
        public mainBlock: Block) { }
}

export class Import {
    constructor(
        public packageName: string,
        public importName: string,
        public leadingTrivia: string) { }
    
    parentFile: SourceFile;
}

export class Enum {
    constructor(
        public name: string,
        public values: EnumMember[],
        public leadingTrivia: string) { }

    parentFile: SourceFile;
    attributes: { [name: string]: string|true };
}

export class EnumMember {
    constructor(public name: string) { }

    parentEnum: Enum;
}

export class Interface {
    constructor(
        public name: string,
        public typeArguments: string[],
        public baseInterfaces: Type[],
        public methods: { [name: string]: Method },
        public leadingTrivia: string) { }

    parentFile: SourceFile;
    attributes: { [name: string]: string|true };
}

export class Class {
    constructor(
        public name: string,
        public typeArguments: string[],
        public baseClass: Type,
        public baseInterfaces: Type[],
        public fields: { [name: string]: Field },
        public properties: { [name: string]: Property },
        public constructor_: Constructor,
        public methods: { [name: string]: Method },
        public leadingTrivia: string) { }

    parentFile: SourceFile;
    attributes: { [name: string]: string|true };
}

export class Field implements IVariableWithInitializer {
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression,
        public visibility: Visibility,
        public isStatic: boolean,
        public leadingTrivia: string) { }

    parentClass: Class;
    attributes: { [name: string]: string|true };
}

export class Property implements IVariable {
    constructor(
        public name: string,
        public type: Type,
        public getter: Block,
        public setter: Block,
        public visibility: Visibility,
        public isStatic: boolean,
        public leadingTrivia: string) { }

    parentClass: Class;
    attributes: { [name: string]: string|true };
}

export class MethodParameter implements IVariableWithInitializer {
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { }

    parentMethod: Method;
}

export interface IMethodBase {
    parentClass: Class;
    parameters: MethodParameter[];
    body: Block;
    leadingTrivia: string;
    throws: boolean;
    attributes: { [name: string]: string|true };
}

export class Constructor implements IMethodBase {
    constructor(
        public parameters: MethodParameter[],
        public body: Block,
        public leadingTrivia: string) { }

    parentClass: Class;
    throws: boolean;
    attributes: { [name: string]: string|true };
}

export class Method implements IMethodBase {
    constructor(
        public name: string,
        public typeArguments: string[],
        public parameters: MethodParameter[],
        public body: Block,
        public visibility: Visibility,
        public isStatic: boolean,
        public returns: Type,
        public leadingTrivia: string) { }
    
    parentClass: Class;
    throws: boolean;
    mutates: boolean;
    attributes: { [name: string]: string|true };
}

export class Block {
    constructor(public statements: Statement[]) { }
}
