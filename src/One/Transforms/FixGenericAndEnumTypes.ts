import { OneAst as one } from "../Ast";
import { AstTransformer } from "../AstTransformer";
import { AstHelper } from "../AstHelper";

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