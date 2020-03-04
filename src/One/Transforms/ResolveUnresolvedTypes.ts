import { AstTransformer } from "../AstTransformer";
import { Type, UnresolvedType, ClassType, InterfaceType, EnumType } from "../Ast/AstTypes";
import { SourceFile, Class, Interface, Enum } from "../Ast/Types";
import { ErrorManager } from "../ErrorManager";

export class ResolveUnresolvedTypes extends AstTransformer<void> {
    file: SourceFile;

    constructor(public errorMan = new ErrorManager()) { super(); }

    protected visitType(type: Type) {
        super.visitType(type);
        if (!(type instanceof UnresolvedType)) return null;
        
        const symbol = this.file.availableSymbols.get(type.typeName);
        if (!symbol)
            return this.errorMan.throw(`Unresolved type '${type.typeName}' was not found in available symbols`);

        if (symbol instanceof Class)
            return new ClassType(symbol, type.typeArguments);
        else if (symbol instanceof Interface)
            return new InterfaceType(symbol, type.typeArguments);
        else if (symbol instanceof Enum)
            return new EnumType(symbol);
        else
            return this.errorMan.throw(`Unknown symbol type: ${symbol}`);
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;

        this.errorMan.resetContext("ResolveUnresolvedTypes", this.file);
        super.visitSourceFile(sourceFile);
        this.errorMan.resetContext();

        return null;
    }
}