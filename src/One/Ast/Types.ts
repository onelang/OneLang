import { Statement } from "./Statements";
import { Type, ClassType, GenericsType, EnumType } from "./AstTypes";
import { Expression, ExpressionRoot } from "./Expressions";
import { ErrorManager } from "../ErrorManager";
import { ClassReference, EnumReference, ThisReference, MethodParameterReference, SuperReference, GlobalFunctionReference, StaticFieldReference, EnumMemberReference, InstanceFieldReference, StaticMethodReference, InstanceMethodReference, StaticPropertyReference, InstancePropertyReference, IReferencable, Reference } from "./References";

export enum Visibility { Public, Protected, Private }

/// types: ForeachVariable, Property
///   IVariableWithInitializer: VariableDeclaration, ForVariable, Field, MethodParameter
export interface IVariable {
    name: string;
    type: Type;
}

export interface IClassMember {
    visibility: Visibility;
    isStatic: boolean;
}

/// types: VariableDeclaration, ForVariable, Field, MethodParameter
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
    exports = new Map<string, IImportable>();

    getExport(name: string) {
        const exp = this.exports.get(name) || null;
        if (exp === null)
            throw new Error(`Export ${name} was not found in exported symbols.`);
        return exp;
    }

    addExport(name: string, value: IImportable) {
        this.exports.set(name, value);
    }

    getAllExports() { return Array.from(this.exports.values()); }
}

export class Package {
    constructor(public name: string) { }

    static readonly INDEX = "index";

    files: { [name: string]: SourceFile } = {};
    exportedScopes: { [name: string]: ExportedScope } = {};

    static collectExportsFromFile(file: SourceFile, exportAll: boolean, scope: ExportedScope = null): ExportedScope {
        if (scope === null)
            scope = new ExportedScope();

        for (const cls of Array.from(file.classes.values()).filter(x => x.isExported || exportAll))
            scope.addExport(cls.name, cls);

        for (const intf of Array.from(file.interfaces.values()).filter(x => x.isExported || exportAll))
            scope.addExport(intf.name, intf);

        for (const enum_ of Array.from(file.enums.values()).filter(x => x.isExported || exportAll))
            scope.addExport(enum_.name, enum_);
        
        for (const func of Array.from(file.funcs.values()).filter(x => x.isExported || exportAll))
            scope.addExport(func.name, func);
        
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
        const scope = this.exportedScopes[name] || null;
        if (scope === null)
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
        const pkg = this.packages[name] || null;
        if (pkg === null)
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

export class LiteralTypes {
    constructor(
        public boolean: ClassType,
        public numeric: ClassType,
        public string: ClassType,
        public regex: ClassType,
        public array: ClassType,
        public map: ClassType) { }
}

export class SourceFile {
    /** @creator TypeScriptParser2 */
    constructor(
        public imports: Import[],
        public interfaces: Map<string, Interface>,
        public classes: Map<string, Class>,
        public enums: Map<string, Enum>,
        public funcs: Map<string, GlobalFunction>,
        public mainBlock: Block,
        public sourcePath: SourcePath,
        public exportScope: ExportScopeRef) {
            const fileScope = Package.collectExportsFromFile(this, true);
            this.addAvailableSymbols(fileScope.getAllExports());
        }

    /** @creator ResolveImports */
    availableSymbols = new Map<string, IImportable>();

    addAvailableSymbols(items: IImportable[]): void {
        for (const item of items)
            this.availableSymbols.set(item.name, item);
    }

    literalTypes: LiteralTypes;
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
            if (importAs !== null && !importAll)
                throw new Error("importAs only supported with importAll!");
        }
    
    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
}

export class Enum implements IHasAttributesAndTrivia, IImportable, ISourceFileMember, IReferencable {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public values: Map<string, EnumMember>,
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };

    /** @creator ResolveIdentifiers */
    references: EnumReference[] = [];
    createReference(): Reference { return new EnumReference(this); }

    type = new EnumType(this);
}

export class EnumMember {
    /** @creator TypeScriptParser2 */
    constructor(public name: string) { }

    /** @creator FillParent */
    parentEnum: Enum;
    references: EnumMemberReference[] = [];
}

export interface IInterface {
    name: string;
    typeArguments: string[];
    baseInterfaces: Type[];
    methods: Map<string, Method>;
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
        public methods: Map<string, Method>,
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
}

export class Class implements IHasAttributesAndTrivia, IInterface, IImportable, ISourceFileMember, IReferencable {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public typeArguments: string[],
        public baseClass: Type,
        public baseInterfaces: Type[],
        public fields: Map<string, Field>,
        public properties: Map<string, Property>,
        public constructor_: Constructor,
        public methods: Map<string, Method>,
        public isExported: boolean,
        public leadingTrivia: string) { }

    /** @creator FillParent */
    parentFile: SourceFile;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };

    /** @creator ResolveIdentifiers */
    classReferences: ClassReference[] = [];
    /** @creator ResolveIdentifiers */
    thisReferences: ThisReference[] = [];
    /** @creator ResolveIdentifiers */
    superReferences: SuperReference[] = [];

    createReference(name: string): Reference {
        // TODO: hack
        return name === "this" ? <Reference>new ThisReference(this) : 
            name === "super" ? <Reference>new SuperReference(this) : 
            <Reference>new ClassReference(this);
        }

    type = new ClassType(this, this.typeArguments.map(x => new GenericsType(x)));
}

export class Field implements IVariableWithInitializer, IHasAttributesAndTrivia, IClassMember {
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
    staticReferences: StaticFieldReference[] = [];
    instanceReferences: InstanceFieldReference[] = [];
}

export class Property implements IVariable, IHasAttributesAndTrivia, IClassMember {
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
    staticReferences: StaticPropertyReference[] = [];
    instanceReferences: InstancePropertyReference[] = [];
}

export class MethodParameter implements IVariableWithInitializer, IReferencable {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { }

    /** @creator FillParent */
    parentMethod: Method;

    /** @creator ResolveIdentifiers */
    references: MethodParameterReference[] = [];
    createReference(): Reference { return new MethodParameterReference(this); }
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

export class Method implements IMethodBase, IHasAttributesAndTrivia, IClassMember {
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
    staticReferences: StaticMethodReference[] = [];
    instanceReferences: InstanceMethodReference[] = [];
}

export class GlobalFunction implements IMethodBase, IImportable, IHasAttributesAndTrivia, IReferencable {
    /** @creator TypeScriptParser2 */
    constructor(
        public name: string,
        public parameters: MethodParameter[],
        public body: Block,
        public returns: Type,
        public isExported: boolean,
        public leadingTrivia: string) { }
    
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
    throws: boolean;

    /** @creator ResolveIdentifiers */
    references: GlobalFunctionReference[] = [];
    createReference(): Reference { return new GlobalFunctionReference(this); }
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
