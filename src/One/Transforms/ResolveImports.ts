import { Workspace } from "../Ast/Types";
import { Linq } from "../../Utils/Underscore";
import { UnresolvedType } from "../Ast/AstTypes";

export class ResolveImports {
    static processWorkspace(ws: Workspace) {
        for (const file of new Linq(Object.values(ws.packages)).selectMany(x => Object.values(x.files)).get()) {
            for (const imp of file.imports) {
                const pkg = ws.getPackage(imp.exportScope.packageName);
                const scope = pkg.getExportedScope(imp.exportScope.scopeName);
                imp.importedTypes = imp.importAll ? scope.getAllTypes() : 
                    imp.importedTypes.map(x => x instanceof UnresolvedType ? scope.getType(x.typeName) : x);
            }
        }
    }
}