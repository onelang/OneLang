import { Workspace, Package, SourcePath, SourceFile, ExportedScope, LiteralTypes, Class, ExportScopeRef } from "./Ast/Types";
import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";
import { PackageManager } from "../StdLib/PackageManager";
import { PackagesFolderSource } from "../StdLib/PackagesFolderSource";
import { FillParent } from "./Transforms/FillParent";
import { FillAttributesFromTrivia } from "./Transforms/FillAttributesFromTrivia";
import { ResolveGenericTypeIdentifiers } from "./Transforms/ResolveGenericTypeIdentifiers";
import { ResolveUnresolvedTypes } from "./Transforms/ResolveUnresolvedTypes";
import { ResolveImports } from "./Transforms/ResolveImports";
import { ConvertToMethodCall } from "./Transforms/ConvertToMethodCall";
import { ResolveIdentifiers } from "./Transforms/ResolveIdentifiers";
import { InstanceOfImplicitCast } from "./Transforms/InstanceOfImplicitCast";
import { DetectMethodCalls } from "./Transforms/DetectMethodCalls";
import { InferTypes } from "./Transforms/InferTypes";
import { CollectInheritanceInfo } from "./Transforms/CollectInheritanceInfo";
import { FillMutabilityInfo } from "./Transforms/FillMutabilityInfo";
import { AstTransformer } from "./AstTransformer";
import { ITransformer } from "./ITransform";
import { LambdaCaptureCollector } from "./Transforms/LambdaCaptureCollector";

export interface ICompilerHooks {
    afterStage(stageName: string): void;
}

export class Compiler {
    pacMan: PackageManager = null;
    workspace: Workspace = null;
    nativeFile: SourceFile = null;
    nativeExports: ExportedScope = null;
    projectPkg: Package = null;
    hooks: ICompilerHooks = null;

    async init(packagesDir: string): Promise<void> {
        this.pacMan = new PackageManager(new PackagesFolderSource(packagesDir));
        await this.pacMan.loadAllCached();
    }

    setupNativeResolver(content: string): void {
        this.nativeFile = TypeScriptParser2.parseFile(content);
        this.nativeExports = Package.collectExportsFromFile(this.nativeFile, true);
        new FillParent().visitSourceFile(this.nativeFile);
        FillAttributesFromTrivia.processFile(this.nativeFile);
        new ResolveGenericTypeIdentifiers().visitSourceFile(this.nativeFile);
        new ResolveUnresolvedTypes().visitSourceFile(this.nativeFile);
        new FillMutabilityInfo().visitSourceFile(this.nativeFile);
    }

    newWorkspace(pkgName = "@"): void {
        this.workspace = new Workspace();
        for (const intfPkg of this.pacMan.interfacesPkgs) {
            const libName = `${intfPkg.interfaceYaml.vendor}.${intfPkg.interfaceYaml.name}-v${intfPkg.interfaceYaml.version}`;
            this.addInterfacePackage(libName, intfPkg.definition);
        }

        this.projectPkg = new Package(pkgName, false);
        this.workspace.addPackage(this.projectPkg);
    }

    addInterfacePackage(libName: string, definitionFileContent: string): void {
        const libPkg = new Package(libName, true);
        const file = TypeScriptParser2.parseFile(definitionFileContent, new SourcePath(libPkg, Package.INDEX));
        this.setupFile(file);
        libPkg.addFile(file, true);
        this.workspace.addPackage(libPkg);
    }

    setupFile(file: SourceFile): void {
        file.addAvailableSymbols(this.nativeExports.getAllExports());
        file.literalTypes = new LiteralTypes(
            (<Class>file.availableSymbols.get("TsBoolean")).type,
            (<Class>file.availableSymbols.get("TsNumber")).type,
            (<Class>file.availableSymbols.get("TsString")).type,
            (<Class>file.availableSymbols.get("RegExp")).type,
            (<Class>file.availableSymbols.get("TsArray")).type,
            (<Class>file.availableSymbols.get("TsMap")).type,
            (<Class>file.availableSymbols.get("Error")).type,
            (<Class>file.availableSymbols.get("Promise")).type);
        file.arrayTypes = [
            (<Class>file.availableSymbols.get("TsArray")).type,
            (<Class>file.availableSymbols.get("IterableIterator")).type,
            (<Class>file.availableSymbols.get("RegExpExecArray")).type,
            (<Class>file.availableSymbols.get("TsString")).type,
            (<Class>file.availableSymbols.get("Set")).type];
    }

    addProjectFile(fn: string, content: string): void {
        const file = TypeScriptParser2.parseFile(content, new SourcePath(this.projectPkg, fn));
        this.setupFile(file);
        this.projectPkg.addFile(file);
    }

    processWorkspace(): void {
        for (const pkg of Object.values(this.workspace.packages).filter(x => x.definitionOnly)) {
            // sets method's parentInterface property
            new FillParent().visitPackage(pkg);
            FillAttributesFromTrivia.processPackage(pkg);
            new ResolveGenericTypeIdentifiers().visitPackage(pkg);
            new ResolveUnresolvedTypes().visitPackage(pkg);
            //if (this.hooks !== null) this.hooks.afterStage("FillAttributesFromTrivia");
        }

        new FillParent().visitPackage(this.projectPkg);
        if (this.hooks !== null) this.hooks.afterStage("FillParent");

        FillAttributesFromTrivia.processPackage(this.projectPkg);
        if (this.hooks !== null) this.hooks.afterStage("FillAttributesFromTrivia");

        ResolveImports.processWorkspace(this.workspace);
        if (this.hooks !== null) this.hooks.afterStage("ResolveImports");

        const transforms: ITransformer[] = [];
        transforms.push(new ResolveGenericTypeIdentifiers());
        transforms.push(new ConvertToMethodCall());
        transforms.push(new ResolveUnresolvedTypes());
        transforms.push(new ResolveIdentifiers());
        transforms.push(new InstanceOfImplicitCast());
        transforms.push(new DetectMethodCalls());
        transforms.push(new InferTypes());
        transforms.push(new CollectInheritanceInfo());
        transforms.push(new FillMutabilityInfo());
        transforms.push(new LambdaCaptureCollector());
        for (const trans of transforms) {
            trans.visitPackage(this.projectPkg);
            if (this.hooks !== null) this.hooks.afterStage(trans.name);
        }
    }
}