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

export class Compiler {
    pacMan: PackageManager = null;
    workspace: Workspace = null;
    nativeFile: SourceFile = null;
    nativeExports: ExportedScope = null;
    projectPkg: Package = null;

    async init(packagesDir: string): Promise<void> {
        this.pacMan = new PackageManager(new PackagesFolderSource(packagesDir));
        await this.pacMan.loadAllCached();
    }

    setupNativeResolver(content: string) {
        this.nativeFile = TypeScriptParser2.parseFile(content);
        this.nativeExports = Package.collectExportsFromFile(this.nativeFile, true);
        new FillParent().visitSourceFile(this.nativeFile);
        FillAttributesFromTrivia.processFile(this.nativeFile);
        new ResolveGenericTypeIdentifiers().visitSourceFile(this.nativeFile);
        new ResolveUnresolvedTypes().visitSourceFile(this.nativeFile);
    }

    newWorkspace() {
        this.workspace = new Workspace();
        for (const intfPkg of this.pacMan.interfacesPkgs) {
            const libName = `${intfPkg.interfaceYaml.vendor}.${intfPkg.interfaceYaml.name}-v${intfPkg.interfaceYaml.version}`;
            const libPkg = new Package(libName);
            const file = TypeScriptParser2.parseFile(intfPkg.definition, new SourcePath(libPkg, Package.INDEX));
            libPkg.addFile(file);
            this.workspace.addPackage(libPkg);
        }

        this.projectPkg = new Package("@");
        this.workspace.addPackage(this.projectPkg);
    }

    addOverlayPackage(pkgName: string) {
        const jsYamlPkg = new Package(pkgName);
        jsYamlPkg.addFile(new SourceFile([], [], [], [], [], null, new SourcePath(jsYamlPkg, Package.INDEX), new ExportScopeRef(pkgName, Package.INDEX)));
        this.workspace.addPackage(jsYamlPkg);
    }

    addProjectFile(fn: string, content: string) {
        const file = TypeScriptParser2.parseFile(content, new SourcePath(this.projectPkg, fn));
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
        this.projectPkg.addFile(file);
    }

    processWorkspace() {
        new FillParent().visitPackage(this.projectPkg);
        FillAttributesFromTrivia.processPackage(this.projectPkg);
        ResolveImports.processWorkspace(this.workspace);
        new ResolveGenericTypeIdentifiers().visitPackage(this.projectPkg);
        new ConvertToMethodCall().visitPackage(this.projectPkg);
        new ResolveUnresolvedTypes().visitPackage(this.projectPkg);
        new ResolveIdentifiers().visitPackage(this.projectPkg);
        new InstanceOfImplicitCast().visitPackage(this.projectPkg);
        new DetectMethodCalls().visitPackage(this.projectPkg);
        new InferTypes().visitPackage(this.projectPkg);
        new CollectInheritanceInfo().visitPackage(this.projectPkg);
    }
}