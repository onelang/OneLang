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

export interface ISourceFileMember {
    parentFile: SourceFile;
}

export class Package {
    constructor(public name: string) { }
}

export class SourcePath {
    constructor(
        public pkg: Package,
        public path: string
    ) { }
}

export class SourceFile {
    /** @creator TypeScriptParser2 */
    constructor(
        public imports: Import[],
        public interfaces: { [name: string]: Interface },
        public classes: { [name: string]: Class },
        public enums: { [name: string]: Enum },
        public mainBlock: Block,
        public sourcePath: SourcePath,
        public exportScope: ExportScope) { }
}

export class ExportScope {
    constructor(
        public packageName: string,
        public scopeName: string) { }
}

/**
 * The following object types can be imported: Enum, Interface, Class
 */
export class Import implements IHasAttributesAndTrivia, ISourceFileMember {
    /** @creator TypeScriptParser2 */
    constructor(
        /** module and filename in TS, namespace in C#, package name in Go, etc */
        public exportScope: ExportScope,
        /** null means it will import everything from the namespace */
        public importedType: Type,
        public importAs: string,
        public leadingTrivia: string) { }
    
    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };

    get importAll() { return this.importedType === null; }
}

export class Enum implements IHasAttributesAndTrivia, IExportable, ISourceFileMember {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public values: EnumMember[],
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class EnumMember {
    /** @creator TypeScriptParser2 */
    constructor(public name: string) { }

    /** @creator FillParent */
    parentEnum: Enum;
}

export interface IInterface {
    name: string;
    typeArguments: string[];
    baseInterfaces: Type[];
    methods: { [name: string]: Method };
    leadingTrivia: string;
}

export interface IExportable {
    isExported: boolean;
}

export class Interface implements IHasAttributesAndTrivia, IInterface, IExportable, ISourceFileMember {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public typeArguments: string[],
        public baseInterfaces: Type[],
        public methods: { [name: string]: Method },
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
}

export class Class implements IHasAttributesAndTrivia, IInterface, IExportable, ISourceFileMember {
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
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
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

    /** @creator FillParent */
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

    /** @creator FillParent */
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

    /** @creator FillParent */
    parentMethod: Method;
}

export interface IMethodBase extends IHasAttributesAndTrivia {
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

    /** @creator FillParent */
    parentClass: Class;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
    throws: boolean;
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
    
    /** @creator FillParent */
    parentInterface: IInterface;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
    throws: boolean;
    mutates: boolean;
}

export class Block {
    /** @creator TypeScriptParser2 */
    constructor(public statements: Statement[]) { }
}
