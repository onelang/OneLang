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

export interface IHasAttributesAndTrivia {
    leadingTrivia: string;
    attributes: { [name: string]: string|true };
}

export class SourceFile {
    /** @creator TypeScriptParser2 */
    constructor(
        public imports: Import[],
        public interfaces: { [name: string]: Interface },
        public classes: { [name: string]: Class },
        public enums: { [name: string]: Enum },
        public mainBlock: Block) { }
}

/**
 * The following object types can be imported: Enum, Interface, Class
 */
export class Import implements IHasAttributesAndTrivia {
    /** @creator TypeScriptParser2 */
    constructor(
        public fileName: string,
        public importedType: Type,
        public leadingTrivia: string) { }
    
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
    importedFile: SourceFile;
}

export class Enum implements IHasAttributesAndTrivia, IImportable {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public values: EnumMember[],
        public leadingTrivia: string) { }

    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class EnumMember {
    /** @creator TypeScriptParser2 */
    constructor(public name: string) { }

    parentEnum: Enum;
}

export interface IInterface {
    name: string;
    typeArguments: string[];
    baseInterfaces: Type[];
    methods: { [name: string]: Method };
    leadingTrivia: string;
}

export interface IImportable {}

export class Interface implements IHasAttributesAndTrivia, IInterface, IImportable {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public typeArguments: string[],
        public baseInterfaces: Type[],
        public methods: { [name: string]: Method },
        public leadingTrivia: string) { }

    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class Class implements IHasAttributesAndTrivia, IInterface, IImportable {
    /** @creator TypeScriptParser2 */
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
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class Field implements IVariableWithInitializer, IHasAttributesAndTrivia {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression,
        public visibility: Visibility,
        public isStatic: boolean,
        public leadingTrivia: string) { }

    parentClass: Class;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class Property implements IVariable, IHasAttributesAndTrivia {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public type: Type,
        public getter: Block,
        public setter: Block,
        public visibility: Visibility,
        public isStatic: boolean,
        public leadingTrivia: string) { }

    parentClass: Class;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class MethodParameter implements IVariableWithInitializer {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { }

    parentMethod: Method;
}

export interface IMethodBase extends IHasAttributesAndTrivia {
    parentClass: Class;
    parameters: MethodParameter[];
    body: Block;
    throws: boolean;
}

export class Constructor implements IMethodBase, IHasAttributesAndTrivia {
    /** @creator TypeScriptParser2 */
    constructor(
        public parameters: MethodParameter[],
        public body: Block,
        public leadingTrivia: string) { }

    parentClass: Class;
    throws: boolean;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class Method implements IMethodBase, IHasAttributesAndTrivia {
    /** @creator TypeScriptParser2 */
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
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class Block {
    /** @creator TypeScriptParser2 */
    constructor(public statements: Statement[]) { }
}
