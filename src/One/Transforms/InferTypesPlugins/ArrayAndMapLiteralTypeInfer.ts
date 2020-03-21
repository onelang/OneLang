import { InferTypesPlugin } from "./InferTypesPlugin";
import { Expression, ArrayLiteral, MapLiteral } from "../../Ast/Expressions";
import { Type, ClassType, AnyType, AmbiguousType } from "../../Ast/AstTypes";
import { InferTypes } from "../InferTypes";

export class ArrayAndMapLiteralTypeInfer extends InferTypesPlugin {
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


    visitExpression(expr: Expression): Expression {
        if (expr instanceof ArrayLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items, expr.expectedType, false);
            expr.setActualType(new ClassType(this.main.currentFile.literalTypes.array.decl, [itemType]));
        } else if (expr instanceof MapLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items.map(x => x.value), expr.expectedType, true);
            expr.setActualType(new ClassType(this.main.currentFile.literalTypes.map.decl, [itemType]));
        }
        return null;
    }
}