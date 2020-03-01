import { AstTransformer } from "../AstTransformer";
import { Type, UnresolvedType, ClassType, InterfaceType, EnumType } from "../Ast/AstTypes";
import { SourceFile, ExportedScope, IImportable, Class, Interface, Enum, Package } from "../Ast/Types";
import { Linq } from "../../Utils/Underscore";
import { ErrorManager } from "../ErrorManager";

export class ResolveUnresolvedTypes extends AstTransformer<void> {
    file: SourceFile;

    constructor(public errorMan = new ErrorManager()) { super(); }

    error(msg: string) {
        return this.errorMan.throw(msg, "ResolveUnresolvedTypes");
    }

    protected visitType(type: Type) {
        super.visitType(type);
        if (!(type instanceof UnresolvedType)) return null;
        
        const imported = this.file.availableSymbols[type.typeName];
        if (!imported)
            return this.error(`Imported type '${type.typeName}' was not found from file '${this.file.sourcePath}'`);

        if (imported instanceof Class)
            return new ClassType(imported, type.typeArguments);
        else if (imported instanceof Interface)
            return new InterfaceType(imported, type.typeArguments);
        else if (imported instanceof Enum)
            return new EnumType(imported);
        else
            return this.error(`Unknown imported type ${imported}`);
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;
        return super.visitSourceFile(sourceFile);
    }
}