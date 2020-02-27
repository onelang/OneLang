import { Statement } from "./Statements";
import { Type, ClassType, InterfaceType, EnumType, IImportedType as IExportedType, IImportedType, IType } from "./AstTypes";
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

class ExportedScope {
    types: { [name: string]: IExportedType } = {};

    getType(name: string) {
        const type = this.types[name];
        if (!type)
            throw new Error(`Type ${name} was not found in exported symbols.`);
        return type;
    }

    getAllTypes() { return Object.values(this.types); }
}

export class Package {
    constructor(public name: string) { }

    static readonly INDEX = "index";

    files: { [name: string]: SourceFile } = {};
    exportedScopes: { [name: string]: ExportedScope } = {};

    addFile(file: SourceFile) {
        if (file.sourcePath.pkg !== this || file.exportScope.packageName !== this.name)
            throw new Error("This file belongs to another package!");
        
        this.files[file.sourcePath.path] = file;
        const scope = this.exportedScopes[file.exportScope.scopeName] || 
            (this.exportedScopes[file.exportScope.scopeName] = new ExportedScope());

        for (const cls of Object.values(file.classes).filter(x => x.isExported))
            scope.types[cls.name] = new ClassType(cls);

        for (const intf of Object.values(file.interfaces).filter(x => x.isExported))
            scope.types[intf.name] = new InterfaceType(intf);

        for (const enum_ of Object.values(file.enums).filter(x => x.isExported))
            scope.types[enum_.name] = new EnumType(enum_);
    }

    getExportedScope(name: string) {
        const scope = this.exportedScopes[name];
        if (!scope)
            throw new Error(`Scope "${name}" was not found in package "${this.name}"`);
        return scope;
    }
}

export class Workspace {
    packages: { [name: string]: Package } = {};

    addPackage(pkg: Package) { 
        this.packages[pkg.name] = pkg;
    }

    getPackage(name: string) {
        const pkg = this.packages[name];
        if (!pkg)
            throw new Error(`Package was not found: "${name}"`);
        return pkg;
    }
}

export class SourcePath {
    constructor(
        public pkg: Package,
        public path: string) { }
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
        public exportScope: ExportScopeRef) { }
}

export class ExportScopeRef {
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
        public exportScope: ExportScopeRef,
        public importAll: boolean,
        public importedTypes: IType[],
        public importAs: string,
        public leadingTrivia: string) {
            if (importAs && !importAll)
                throw new Error("importAs only supported with importAll!");
        }
    
    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string|true };
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
