import { AstTransformer } from "../AstTransformer";
import { Type, UnresolvedType } from "../Ast/AstTypes";
import { SourceFile } from "../Ast/Types";

export class ResolveUnresolvedTypes extends AstTransformer<void> {
    sourceFile: SourceFile;

    protected visitType(type: Type) {
        super.visitType(type);
        if (!(type instanceof UnresolvedType)) return null;
        
        console.log(type);
        //this.sourceFile.imports[0].importedTypes
        console.log(this.sourceFile.imports);
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.sourceFile = sourceFile;
        return super.visitSourceFile(sourceFile);
    }
}