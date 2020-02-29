import { AstTransformer } from "../AstTransformer";
import { Type, UnresolvedType, GenericsType } from "../Ast/AstTypes";
import { Class, Method } from "../Ast/Types";

/**
 * After parsing an input source code file, it is not known that a "T" is 
 *   an unknown type called "T" or it is a generic type, as it only turns
 *   out when a class or method is flagged with <T> in its declaration.
 * 
 * So this tranform modifies "T" from (unknown) type "T" to generic type "T"
 *   in classes "ExampleClass<T> { ... T ... }" 
 *   and methods "ExampleMethod<T>(...) { ... T ... }"
 */
export class ResolveGenericTypeIdentifiers extends AstTransformer<void> {
    currentClass: Class;
    currentMethod: Method;

    protected visitClass(cls: Class) {
        this.currentClass = cls;
        return super.visitClass(cls);
    }

    protected visitMethod(method: Method) {
        this.currentMethod = method;
        return super.visitMethod(method);
    }

    protected visitType(type: Type) {
        super.visitType(type);

        //console.log(type && type.constructor.name, JSON.stringify(type));
        if (type instanceof UnresolvedType && 
            ((this.currentClass && this.currentClass.typeArguments.includes(type.typeName)) ||
            (this.currentMethod && this.currentMethod.typeArguments.includes(type.typeName))))
            return new GenericsType(type.typeName);
    }
}