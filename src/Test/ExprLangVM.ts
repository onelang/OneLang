import { ExprLangAst as Ast } from "./ExprLangAst";

export class ExprLangVM {
    static accessMember(obj: object, memberName: string|number) {
        if (typeof obj !== "object")
            throw new Error(`Expected object for accessing member: (${typeof obj})`);
        if (!(memberName in obj))
            throw new Error(`Member '${memberName}' not found in object '${obj.constructor.name}' (${typeof obj})`);
        return obj[memberName];
    }

    static evaluate(expr: Ast.Expression, model: any) {
        if (expr.kind === "literal") {
            const litExpr = <Ast.LiteralExpression> expr;
            return litExpr.value;
        } else if (expr.kind === "identifier") {
            const identifier = <Ast.IdentifierExpression> expr;
            const result = ExprLangVM.accessMember(model, identifier.text);
            return result;
        } else if (expr.kind === "unary") {
            const unaryExpr = <Ast.UnaryExpression> expr;
            const exprValue = ExprLangVM.evaluate(unaryExpr.expr, model);
            if (unaryExpr.op === "!") {
                return !exprValue;
            } else if (unaryExpr.op === "+") {
                return +exprValue;
            } else if (unaryExpr.op === "-") {
                return -exprValue;
            } else
                throw new Error(`Unexpected unary operator: '${unaryExpr.op}'`);
        } else if (expr.kind === "binary") {
            const binaryExpr = <Ast.BinaryExpression> expr;
            const leftValue = ExprLangVM.evaluate(binaryExpr.left, model);
            const rightValue = ExprLangVM.evaluate(binaryExpr.right, model);
            if (binaryExpr.op === "+") {
                return leftValue + rightValue;
            } else if (binaryExpr.op === "-") {
                return leftValue - rightValue;
            } else if (binaryExpr.op === "*") {
                return leftValue * rightValue;
            } else if (binaryExpr.op === "/") {
                return leftValue / rightValue;
            } else if (binaryExpr.op === "<<") {
                return leftValue << rightValue;
            } else if (binaryExpr.op === ">>") {
                return leftValue >> rightValue;
            } else
                throw new Error(`Unexpected binary operator: '${binaryExpr.op}'`);
        } else if (expr.kind === "parenthesized") {
            const parenExpr = <Ast.ParenthesizedExpression> expr;
            const exprValue = ExprLangVM.evaluate(parenExpr, model);
            return exprValue;
        } else if (expr.kind === "conditional") {
            const condExpr = <Ast.ConditionalExpression> expr;
            const condValue = ExprLangVM.evaluate(condExpr.condition, model);
            const result = ExprLangVM.evaluate(condValue ? condExpr.whenTrue : condExpr.whenFalse, model);
            return result;
        } else if (expr.kind === "call") {
            const callExpr = <Ast.CallExpression> expr;
            const method = <(...args) => any>ExprLangVM.evaluate(callExpr.method, model);
            if (typeof method !== "function")
                throw new Error(`Tried to call a non-method value: '${method}' (${typeof method})`);

            let thisObj;
            if (callExpr.method.kind === "propertyAccess") {
                const thisObjExpr = (<Ast.PropertyAccessExpression> callExpr.method).object;
                thisObj = ExprLangVM.evaluate(thisObjExpr, model);
            } else {
                thisObj = model;
            }

            const args = callExpr.arguments.map(arg => ExprLangVM.evaluate(arg, model));
            const result = method.apply(thisObj, args);
            return result;
        } else if (expr.kind === "propertyAccess") {
            const propAccExpr = <Ast.PropertyAccessExpression> expr;
            const object = ExprLangVM.evaluate(propAccExpr.object, model);
            const result = ExprLangVM.accessMember(object, propAccExpr.propertyName);
            return result;
        } else if (expr.kind === "elementAccess") {
            const elemAccExpr = <Ast.ElementAccessExpression> expr;
            const object = ExprLangVM.evaluate(elemAccExpr.object, model);
            const memberName = ExprLangVM.evaluate(elemAccExpr.elementExpr, model);
            const result = ExprLangVM.accessMember(object, memberName);
            return result;
        } else {
            throw new Error(`[ExprLangVM] Unknown expression kind: '${expr.kind}'`);
        }
    }
}
