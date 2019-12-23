import { OneAst as one } from "../Ast";
import { AstTransformer } from "../AstTransformer";
import { AstHelper } from "../AstHelper";

/**
 * After parsing an input source code file, it is not known that a "T" is 
 *   an unknown type called "T" or it is a generic type, as it only turns
 *   out when a class or method is flagged with <T> in its declaration.
 * 
 * So this tranform modifies "T" from (unknown) type "T" to generic type "T"
 *   in classes "ExampleClass<T> { ... T ... }" 
 *   and methods "ExampleMethod<T>(...) { ... T ... }"
 */
export class FixGenericAndEnumTypes extends AstTransformer<void> {
    protected visitType(type: one.Type) {
        super.visitType(type, null);
        
        if (!type || !type.isClassOrInterface) return;

        if ((this.currentClass && this.currentClass.typeArguments.includes(type.className)) || 
            (this.currentMethod && this.currentMethod.typeArguments.includes(type.className))) {
            AstHelper.replaceProperties(type, one.Type.Generics(type.className));
        } else if (type.className in this.schema.enums) {
            AstHelper.replaceProperties(type, one.Type.Enum(type.className));
        }
    }
}