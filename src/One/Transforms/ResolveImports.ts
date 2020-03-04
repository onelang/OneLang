import { Workspace, UnresolvedImport, Package, ExportedScope } from "../Ast/Types";
import { Linq } from "../../Utils/Underscore";
import { UnresolvedType } from "../Ast/AstTypes";

export class ResolveImports {
    static processWorkspace(ws: Workspace, native: ExportedScope) {
        for (const file of new Linq(Object.values(ws.packages)).selectMany(x => Object.values(x.files)).get()) {
            for (const imp of file.imports) {
                const pkg = ws.getPackage(imp.exportScope.packageName);
                const scope = pkg.getExportedScope(imp.exportScope.scopeName);
                imp.imports = imp.importAll ? scope.getAllExports() : 
                    imp.imports.map(x => x instanceof UnresolvedImport ? scope.getExport(x.name) : x);
            }

            const fileScope = Package.collectExportsFromFile(file, true);
            file.availableSymbols = new Linq(file.imports).selectMany(x => x.imports) // all imported symbols
                .concat(native.getAllExports()) // all symbols from native resolver
                .concat(fileScope.getAllExports()).toMap(x => x.name); // all symbols in the file
    
        }
    }
}