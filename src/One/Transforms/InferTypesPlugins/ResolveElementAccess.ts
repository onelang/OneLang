import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, ElementAccessExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, StringLiteral, PropertyAccessExpression } from "../../Ast/Expressions";
import { Type } from "../../Ast/AstTypes";
import { ResolveMethodCalls } from "./ResolveMethodCalls";

// converts `someObj[var]` -> `someObj.get(var)`
// converts `someObj["field-name"]` -> `someObj."field-name"`
export class ResolveElementAccess extends InferTypesPlugin {
    name = "ResolveElementAccess";
    
    canTransform(expr: Expression) { return expr instanceof ElementAccessExpression; }

    transform(expr: Expression): Expression {
        const elementAccExpr = <ElementAccessExpression> expr;
        elementAccExpr.object = this.main.visitExpression(elementAccExpr.object);
        const objectType = elementAccExpr.object.getType();
        if (Type.isAssignableTo(objectType, this.main.currentFile.literalTypes.map) || this.main.currentFile.arrayTypes.some(x => Type.isAssignableTo(objectType, x))) {
            return new UnresolvedMethodCallExpression(elementAccExpr.object, "get", [], [elementAccExpr.elementExpr]);
        } else if (elementAccExpr.elementExpr instanceof StringLiteral) {
            return new PropertyAccessExpression(elementAccExpr.object, elementAccExpr.elementExpr.stringValue);
        } else {
            debugger;
        }
        return elementAccExpr;
    }
}