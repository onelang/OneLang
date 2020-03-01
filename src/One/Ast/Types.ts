import { Statement } from "./Statements";
import { Type } from "./AstTypes";
import { Expression } from "./Expressions";
import { ErrorManager } from "../ErrorManager";

export enum Visibility { Public, Protected, Private }

export interface IVariable {
    name: string;
    type: Type;
}

export interface IVariableWithInitializer extends IVariable {
    initializer: Expression;
}

export interface IHasAttributesAndTrivia {
    leadingTrivia: string;
    attributes: { [name: string]: string };
}

export interface ISourceFileMember {
    parentFile: SourceFile;
}

export class ExportedScope {
    exports: { [name: string]: IImportable } = {};

    getExport(name: string) {
        const exp = this.exports[name];
        if (!exp)
            throw new Error(`Export ${name} was not found in exported symbols.`);
        return exp;
    }

    getAllExports() { return Object.values(this.exports); }
}

export class Package {
    constructor(public name: string) { }

    static readonly INDEX = "index";

    files: { [name: string]: SourceFile } = {};
    exportedScopes: { [name: string]: ExportedScope } = {};

    static collectExportsFromFile(file: SourceFile, exportAll: boolean, scope: ExportedScope = null): ExportedScope {
        if (scope === null)
            scope = new ExportedScope();

        for (const cls of Object.values(file.classes).filter(x => x.isExported || exportAll))
            scope.exports[cls.name] = cls;

        for (const intf of Object.values(file.interfaces).filter(x => x.isExported || exportAll))
            scope.exports[intf.name] = intf;

        for (const enum_ of Object.values(file.enums).filter(x => x.isExported || exportAll))
            scope.exports[enum_.name] = enum_;
        
        return scope;
    }

    addFile(file: SourceFile, exportAll = false) {
        if (file.sourcePath.pkg !== this || file.exportScope.packageName !== this.name)
            throw new Error("This file belongs to another package!");
        
        this.files[file.sourcePath.path] = file;
        const scopeName = file.exportScope.scopeName;
        this.exportedScopes[scopeName] = Package.collectExportsFromFile(file, exportAll, this.exportedScopes[scopeName]);
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
    errorManager = new ErrorManager();

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

    toString() { return `${this.pkg.name}/${this.path}`; }
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
        public imports: IImportable[],
        public importAs: string,
        public leadingTrivia: string) {
            if (importAs && !importAll)
                throw new Error("importAs only supported with importAll!");
        }
    
    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
}

export class Enum implements IHasAttributesAndTrivia, IImportable, ISourceFileMember {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public values: EnumMember[],
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
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

export interface IImportable {
    name: string;
    isExported: boolean;
}

export class UnresolvedImport implements IImportable {
    constructor(public name: string) { }
    isExported = true;
}

export class Interface implements IHasAttributesAndTrivia, IInterface, IImportable, ISourceFileMember {
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
    attributes: { [name: string]: string };
}

export class Class implements IHasAttributesAndTrivia, IInterface, IImportable, ISourceFileMember {
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
    attributes: { [name: string]: string };
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
    attributes: { [name: string]: string };
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
    attributes: { [name: string]: string };
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
    attributes: { [name: string]: string };
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
    attributes: { [name: string]: string };
    throws: boolean;
    mutates: boolean;
}

export class Block {
    /** @creator TypeScriptParser2 */
    constructor(public statements: Statement[]) { }
}

export class Lambda extends Expression {
    constructor(
        public parameters: MethodParameter[],
        public body: Block) { super(); }
}
