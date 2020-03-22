import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, PropertyAccessExpression } from "../../Ast/Expressions";
import { EnumMemberReference, EnumReference } from "../../Ast/References";

export class ResolveEnumMemberAccess extends InferTypesPlugin {
    name = "ResolveEnumMemberAccess";

    canTransform(expr: Expression) { return expr instanceof PropertyAccessExpression && expr.object instanceof EnumReference; }

    transform(expr: Expression): Expression {
        const pa = <PropertyAccessExpression> expr;
        const enumMemberRef = <EnumReference> pa.object;
        const member = enumMemberRef.decl.values.find(x => x.name ===  pa.propertyName) || null;
        if (member === null) {
            this.errorMan.throw(`Enum member was not found: ${enumMemberRef.decl.name}::${pa.propertyName}`);
            return null;
        }
        return new EnumMemberReference(member);
    }

    canDetectType(expr: Expression) { return expr instanceof EnumMemberReference; }

    detectType(expr: Expression) {
        expr.setActualType((<EnumMemberReference>expr).decl.parentEnum.type);
        return true;
    }
}