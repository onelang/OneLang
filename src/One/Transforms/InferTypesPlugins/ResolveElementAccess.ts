import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, ElementAccessExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, StringLiteral, PropertyAccessExpression, BinaryExpression } from "../../Ast/Expressions";
import { Type } from "../../Ast/AstTypes";
import { ResolveMethodCalls } from "./ResolveMethodCalls";

// converts `someObj[var]` -> `someObj.get(var)`
// converts `someObj["field-name"]` -> `someObj."field-name"`
export class ResolveElementAccess extends InferTypesPlugin {
    name = "ResolveElementAccess";
    
    canTransform(expr: Expression) { 
        const isSet = expr instanceof BinaryExpression && expr.left instanceof ElementAccessExpression && expr.operator === "=";
        return expr instanceof ElementAccessExpression || isSet; }

    isMapOrArrayType(type: Type) {
        return Type.isAssignableTo(type, this.main.currentFile.literalTypes.map) || this.main.currentFile.arrayTypes.some(x => Type.isAssignableTo(type, x));
    }

    transform(expr: Expression): Expression {
        if (expr instanceof BinaryExpression && expr.left instanceof ElementAccessExpression) {
            expr.left.object = this.main.visitExpression(expr.left.object);
            if (this.isMapOrArrayType(expr.left.object.getType()))
                return new UnresolvedMethodCallExpression(expr.left.object, "set", [], [expr.left.elementExpr, expr.right]);
        } else if (expr instanceof ElementAccessExpression) {
            expr.object = this.main.visitExpression(expr.object);
            if (this.isMapOrArrayType(expr.object.getType()))
                return new UnresolvedMethodCallExpression(expr.object, "get", [], [expr.elementExpr]);
            else if (expr.elementExpr instanceof StringLiteral)
                return new PropertyAccessExpression(expr.object, expr.elementExpr.stringValue);
        }
        debugger;
        return expr;
    }
}