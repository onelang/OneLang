import { ExprLangAst as Ast } from "./ExprLangAst";

export interface IMethodHandler {
    call(method: any, args: any[], thisObj: object, model: object);
}

export class JSMethodHandler implements IMethodHandler {
    call(method: any, args: any[], thisObj: object, model: object) {
        if (typeof method !== "function")
            throw new Error(`Tried to call a non-method value: '${method}' (${typeof method})`);
        const result = method.apply(thisObj, args);
        return result;
    }
}

export class ExprLangVM {
    methodHandler: IMethodHandler;

    static accessMember(obj: object, memberName: string|number) {
        if (typeof obj !== "object")
            throw new Error(`Expected object for accessing member: (${typeof obj})`);
        if (!(memberName in obj))
            throw new Error(`Member '${memberName}' not found in object '${obj.constructor.name}' (${typeof obj})`);
        return obj[memberName];
    }

    evaluate(expr: Ast.Expression, model: any) {
        if (expr.kind === "literal") {
            const litExpr = <Ast.LiteralExpression> expr;
            return litExpr.value;
        } else if (expr.kind === "identifier") {
            const identifier = <Ast.IdentifierExpression> expr;
            const result = ExprLangVM.accessMember(model, identifier.text);
            return result;
        } else if (expr.kind === "unary") {
            const unaryExpr = <Ast.UnaryExpression> expr;
            const exprValue = this.evaluate(unaryExpr.expr, model);
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
            const leftValue = this.evaluate(binaryExpr.left, model);
            const rightValue = this.evaluate(binaryExpr.right, model);
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
            const exprValue = this.evaluate(parenExpr, model);
            return exprValue;
        } else if (expr.kind === "conditional") {
            const condExpr = <Ast.ConditionalExpression> expr;
            const condValue = this.evaluate(condExpr.condition, model);
            const result = this.evaluate(condValue ? condExpr.whenTrue : condExpr.whenFalse, model);
            return result;
        } else if (expr.kind === "call") {
            const callExpr = <Ast.CallExpression> expr;
            const method = this.evaluate(callExpr.method, model);

            let thisObj;
            if (callExpr.method.kind === "propertyAccess") {
                const thisObjExpr = (<Ast.PropertyAccessExpression> callExpr.method).object;
                thisObj = this.evaluate(thisObjExpr, model);
            } else {
                thisObj = model;
            }

            const args = callExpr.arguments.map(arg => this.evaluate(arg, model));
            
            if (!this.methodHandler)
                throw new Error(`Method handler was not set!`);
            const result = this.methodHandler.call(method, args, thisObj, model);
            return result;
        } else if (expr.kind === "propertyAccess") {
            const propAccExpr = <Ast.PropertyAccessExpression> expr;
            const object = this.evaluate(propAccExpr.object, model);
            const result = ExprLangVM.accessMember(object, propAccExpr.propertyName);
            return result;
        } else if (expr.kind === "elementAccess") {
            const elemAccExpr = <Ast.ElementAccessExpression> expr;
            const object = this.evaluate(elemAccExpr.object, model);
            const memberName = this.evaluate(elemAccExpr.elementExpr, model);
            const result = ExprLangVM.accessMember(object, memberName);
            return result;
        } else {
            throw new Error(`[ExprLangVM] Unknown expression kind: '${expr.kind}'`);
        }
    }
}
