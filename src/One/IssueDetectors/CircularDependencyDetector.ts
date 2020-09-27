import { ClassType } from "../Ast/AstTypes";
import { IInterface, IResolvedImportable, Package, SourceFile, Workspace } from "../Ast/Types";

export interface IGraphVisitor<TNode> {
    processNode(node: TNode): void;
}

export class GraphCycleDetector<TNode> {
    nodeIsInPath: Map<TNode, boolean> = null;

    constructor(public visitor: IGraphVisitor<TNode>) { }

    findCycles(nodes: TNode[]) {
        this.nodeIsInPath = new Map<TNode, boolean>();
        for (const node of nodes)
            this.visitNode(node);
    }

    /** Returns true if cycle is found */
    visitNode(node: TNode): boolean {
        if (!this.nodeIsInPath.has(node)) { // untouched node
            this.nodeIsInPath.set(node, true);
            this.visitor.processNode(node);
            this.nodeIsInPath.set(node, false);
            return false;
        } else
            // true = node used in current path = cycle
            // false = node was already scanned previously (not a cycle)
            return this.nodeIsInPath.get(node);
    }
}

export enum DetectionMode { AllImports, AllInheritence, BaseClassesOnly }

export class CircularDependencyDetector implements IGraphVisitor<SourceFile> {
    detector = new GraphCycleDetector<SourceFile>(this);

    constructor(public detectionMode: DetectionMode) { }

    processIntfs(file: SourceFile, type: string, intfs: IInterface[]) {
        for (const intf of intfs)
            for (const baseIntf of intf.getAllBaseInterfaces())
                if (baseIntf.parentFile !== file && this.detector.visitNode(baseIntf.parentFile))
                    console.error(`Circular dependency found in file '${file.exportScope.getId()}': ${type} '${intf.name}' inherited from '${baseIntf.name}' (from '${baseIntf.parentFile.exportScope.getId()}')`);
    }

    processNode(file: SourceFile) {
        if (this.detectionMode === DetectionMode.AllImports) {
            for (const imp of file.imports)
                for (const impSym of imp.imports) {
                    const impFile = (<IResolvedImportable>impSym).parentFile;
                    if (this.detector.visitNode(impFile))
                        console.error(`Circular dependency found in file '${file.exportScope.getId()}' via the import '${impSym.name}' imported from '${impFile.exportScope.getId()}'`);
                }
        } else if (this.detectionMode === DetectionMode.AllInheritence) {
            this.processIntfs(file, "class", file.classes);
            this.processIntfs(file, "interface", file.interfaces);
        } else if (this.detectionMode === DetectionMode.BaseClassesOnly) {
            for (const cls of file.classes) {
                const baseClass = (<ClassType>cls.baseClass).decl;
                if (baseClass.parentFile !== file && this.detector.visitNode(baseClass.parentFile))
                    console.error(`Circular dependency found in file '${file.exportScope.getId()}': class '${cls.name}' inherited from '${baseClass.name}' (from '${baseClass.parentFile.exportScope.getId()}')`);
            }
        }
    }

    processPackage(pkg: Package): void {
        this.detector.findCycles(Object.values(pkg.files));
    }
    
    processWorkspace(ws: Workspace): void {
        for (const pkg of Object.values(ws.packages))
            this.processPackage(pkg);
    }
}