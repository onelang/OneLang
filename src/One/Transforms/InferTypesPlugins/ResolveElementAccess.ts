import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, ElementAccessExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, StringLiteral, PropertyAccessExpression, BinaryExpression } from "../../Ast/Expressions";
import { ResolveMethodCalls } from "./ResolveMethodCalls";
import { IType } from "../../Ast/Interfaces";
import { TypeHelper } from "../../Ast/AstTypes";

// converts `someObj[var]` -> `someObj.get(var)`
// converts `someObj["field-name"]` -> `someObj."field-name"`
export class ResolveElementAccess extends InferTypesPlugin {
    constructor() { super("ResolveElementAccess"); }
    
    canTransform(expr: Expression) { 
        const isSet = expr instanceof BinaryExpression && expr.left instanceof ElementAccessExpression && ["="/*, "+=", "-="*/].includes(expr.operator);
        return expr instanceof ElementAccessExpression || isSet; }

    isMapOrArrayType(type: IType) {
        return TypeHelper.isAssignableTo(type, this.main.currentFile.literalTypes.map) || this.main.currentFile.arrayTypes.some(x => TypeHelper.isAssignableTo(type, x));
    }

    transform(expr: Expression): Expression {
        // TODO: convert ElementAccess to ElementGet and ElementSet expressions
        if (expr instanceof BinaryExpression && expr.left instanceof ElementAccessExpression) {
            expr.left.object = this.main.runPluginsOn(expr.left.object);
            if (this.isMapOrArrayType(expr.left.object.getType())) {
                //const right = expr.operator === "=" ? expr.right : new BinaryExpression(<Expression>expr.left.clone(), expr.operator === "+=" ? "+" : "-", expr.right);
                return new UnresolvedMethodCallExpression(expr.left.object, "set", [], [expr.left.elementExpr, expr.right]);
            }
        } else if (expr instanceof ElementAccessExpression) {
            expr.object = this.main.runPluginsOn(expr.object);
            if (this.isMapOrArrayType(expr.object.getType()))
                return new UnresolvedMethodCallExpression(expr.object, "get", [], [expr.elementExpr]);
            else if (expr.elementExpr instanceof StringLiteral)
                return new PropertyAccessExpression(expr.object, expr.elementExpr.stringValue);
        }
        debugger;
        return expr;
    }
}