import { Workspace, UnresolvedImport, Package, ExportedScope } from "../Ast/Types";
import { Linq } from "../../Utils/Underscore";

export class ResolveImports {
    name = "ResolveImports";
    
    static processWorkspace(ws: Workspace) {
        for (const file of new Linq<Package>(Object.values(ws.packages)).selectMany(x => Object.values(x.files)).get()) {
            for (const imp of file.imports) {
                const pkg = ws.getPackage(imp.exportScope.packageName);
                const scope = pkg.getExportedScope(imp.exportScope.scopeName);
                imp.imports = imp.importAll ? scope.getAllExports() : 
                    imp.imports.map(x => x instanceof UnresolvedImport ? scope.getExport(x.name) : x);
                file.addAvailableSymbols(imp.imports);
            }
        }
    }
}