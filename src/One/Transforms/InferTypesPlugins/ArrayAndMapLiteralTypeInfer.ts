import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, ArrayLiteral, MapLiteral, CastExpression, BinaryExpression } from "../../Ast/Expressions";
import { Type, ClassType, AnyType, AmbiguousType } from "../../Ast/AstTypes";

export class ArrayAndMapLiteralTypeInfer extends InferTypesPlugin {
    name = "ArrayAndMapLiteralTypeInfer";

    protected inferArrayOrMapItemType(items: Expression[], expectedType: Type, isMap: boolean) {
        const itemTypes: Type[] = [];
        for (const item of items)
            if (!itemTypes.some(t => Type.equals(t, item.getType())))
                itemTypes.push(item.getType());

        const literalType = isMap ? this.main.currentFile.literalTypes.map : this.main.currentFile.literalTypes.array;

        let itemType: Type = null;
        if (itemTypes.length === 0) {
            if (!expectedType) {
                this.errorMan.warn(`Could not determine the type of an empty ${isMap ? "MapLiteral" : "ArrayLiteral"}! Will use AmbiguousType`);
                itemType = AmbiguousType.instance;
            } else if (expectedType instanceof ClassType && expectedType.decl === literalType.decl) {
                itemType = expectedType.typeArguments[0];
            } else {
                itemType = AmbiguousType.instance;
            }
        } else if (itemTypes.length === 1) {
            itemType = itemTypes[0];
        } else {
            this.errorMan.warn(`Could not determine the type of ${isMap ? "a MapLiteral" : "an ArrayLiteral"}! Multiple types were found: ${itemTypes.map(x => x.repr()).join(", ")}. Will use AnyType instead.`);
            itemType = AnyType.instance;
        }
        return itemType;
    }

    canDetectType(expr: Expression) { return expr instanceof ArrayLiteral || expr instanceof MapLiteral; }

    detectType(expr: Expression) {
        // make this work: `<{ [name: string]: SomeObject }> {}`
        if (expr.parentNode instanceof CastExpression)
            expr.setExpectedType(expr.parentNode.newType);
        // make this work: `let someMap: { [name: string]: SomeObject } = {};`
        else if (expr.parentNode instanceof BinaryExpression && expr.parentNode.operator === "=" && expr.parentNode.right === expr)
            expr.setExpectedType(expr.parentNode.left.actualType);

        if (expr instanceof ArrayLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items, expr.expectedType, false);
            expr.setActualType(new ClassType(this.main.currentFile.literalTypes.array.decl, [itemType]));
        } else if (expr instanceof MapLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items.map(x => x.value), expr.expectedType, true);
            expr.setActualType(new ClassType(this.main.currentFile.literalTypes.map.decl, [itemType]));
        }

        return true;
    }
}