import { AstTransformer } from "../AstTransformer";
import { UnresolvedType, GenericsType } from "../Ast/AstTypes";
import { Class, Method } from "../Ast/Types";
import { IType } from "../Ast/Interfaces";

/**
 * After parsing an input source code file, it is not known that a "T" is 
 *   an unknown type called "T" or it is a generic type, as it only turns
 *   out when a class or method is flagged with <T> in its declaration.
 * 
 * So this tranform modifies "T" from (unknown) type "T" to generic type "T"
 *   in classes "ExampleClass<T> { ... T ... }" 
 *   and methods "ExampleMethod<T>(...) { ... T ... }"
 */
export class ResolveGenericTypeIdentifiers extends AstTransformer {
    constructor() { super("ResolveGenericTypeIdentifiers"); }

    protected visitType(type: IType): IType {
        super.visitType(type);

        //console.log(type && type.constructor.name, JSON.stringify(type));
        if (type instanceof UnresolvedType && 
            ((this.currentInterface instanceof Class && this.currentInterface.typeArguments.includes(type.typeName)) ||
            (this.currentMethod instanceof Method && this.currentMethod.typeArguments.includes(type.typeName))))
            return new GenericsType(type.typeName);
        
        return null;
    }
}