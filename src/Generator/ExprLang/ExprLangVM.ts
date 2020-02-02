import { ExprLangAst as Ast } from "./ExprLangAst";

class ExprLangError extends Error { }

export interface IModelHandler {
    methodCall(method: any, args: any[], thisObj: object, model: object);
    memberAccess(obj: object, memberName: string|number, isProperty: boolean);
}

export class JSModelHandler implements IModelHandler {
    static methodCall(method: any, args: any[], thisObj: object, model: object) {
        if (typeof method !== "function")
            throw new ExprLangError(`Tried to call a non-method value: '${method}' (${typeof method})`);
        const result = method.apply(thisObj, args);
        return result;
    }

    static memberAccess(obj: object, memberName: string|number, isProperty: boolean) {
        if (typeof obj !== "object")
            throw new ExprLangError(`Expected object for accessing member: (${typeof obj})`);

        if (!(memberName in obj))
            //throw new ExprLangError(`Member '${memberName}' not found in object '${obj.constructor.name}' (${typeof obj})`);
            return null;

        return obj[memberName];
    }

    methodCall(method: any, args: any[], thisObj: object, model: object) {
        return JSModelHandler.methodCall(method, args, thisObj, model);
    }

    memberAccess(obj: object, memberName: string|number, isProperty: boolean) {
        return JSModelHandler.memberAccess(obj, memberName, isProperty);
    }
}

export class VariableSource {
    vars: { [varName: string]: any } = {};
    callbacks: { [varName: string]: () => any } = {};

    constructor(public name: string) { }

    checkUnique(varName: string, allowOverwrite = false) {
        if (!varName)
            throw new ExprLangError("Variable name is missing!");

        if (typeof varName !== "string")
            throw new ExprLangError(`Expected string as variable name!`);

        if (varName in this.callbacks)
            throw new ExprLangError(`Callback was already set for variable '${varName}'`);

        if (!allowOverwrite && varName in this.vars)
            throw new ExprLangError(`Variable '${varName}' was already set`);
    }

    addCallback(varName: string, callback: () => any) {
        this.checkUnique(varName);
        this.callbacks[varName] = callback;
    }

    setVariable(varName: string, value: any, allowOverwrite = false) {
        this.checkUnique(varName, allowOverwrite);
        this.vars[varName] = value;
    }
    
    getVariable(varName: string) {
        let result = null;

        if (varName in this.vars) {
            result = this.vars[varName];
        } else if (varName in this.callbacks) {
            result = this.callbacks[varName]();
        }

        return result;
    }

    printAll() {
        const result = Object.keys(this.vars).map(varName => `${varName}: ${this.vars[varName]}`)
            .concat(Object.keys(this.callbacks).map(varName => `${varName}: ${this.callbacks[varName]()}`));
        return result.map(x => `${x}\n`).join("");
    }

    static createSingle(varName: string, value: any, sourceName?: string) {
        const source = new VariableSource(sourceName || `var: ${varName}`);
        source.setVariable(varName, value);
        return source;
    }

    static fromObject(obj: object, sourceName?: string) {
        const source = new VariableSource(sourceName || `object`);
        for (const key in obj)
            source.setVariable(key, obj[key]);
        return source;
    }
}

export class VariableContext {
    constructor(public sources: VariableSource[] = []) { }

    inherit(...newSources: VariableSource[]) {
        return new VariableContext([...newSources, ...this.sources]);
    }

    getVariable(varName: string) {
        for (const source of this.sources) {
            const result = source.getVariable(varName);
            if (result !== null)
                return result;
        }

        throw new ExprLangError(`Variable '${varName}' was not found in contexts: ` 
            + this.sources.map(x => `'${x.name}'`).join(", "));
    }

    printAll() {
        const result = this.sources.map(src => `Source['${src.name}']:\n  ${src.printAll().replace(/\n/g, "\n  ")}`).join("\n");
        return result;
    }
}

export class ExprLangVM {
    modelHandler: IModelHandler;

    constructor(modelHandler?: IModelHandler) {
        this.modelHandler = modelHandler || new JSModelHandler();
    }

    evaluate(expr: Ast.Expression, vars?: VariableContext) {
        if (expr.kind === "literal") {
            const litExpr = <Ast.LiteralExpression> expr;
            return litExpr.value;
        } else if (expr.kind === "identifier") {
            const identifier = <Ast.IdentifierExpression> expr;
            if (identifier.text === "true") {
                return true;
            } else if (identifier.text === "false") {
                return false;
            } else if (identifier.text === "null") {
                return null;
            } else {
                if (!vars)
                    throw new ExprLangError(`Variable context was not set!`);

                const result = vars.getVariable(identifier.text);
                return result;
            }
        } else if (expr.kind === "unary") {
            const unaryExpr = <Ast.UnaryExpression> expr;
            const exprValue = this.evaluate(unaryExpr.expr, vars);
            if (unaryExpr.op === "!") {
                return !exprValue;
            } else if (unaryExpr.op === "+") {
                return +exprValue;
            } else if (unaryExpr.op === "-") {
                return -exprValue;
            } else
                throw new ExprLangError(`Unexpected unary operator: '${unaryExpr.op}'`);
        } else if (expr.kind === "binary") {
            const binaryExpr = <Ast.BinaryExpression> expr;
            const leftValue = this.evaluate(binaryExpr.left, vars);
            const rightValue = this.evaluate(binaryExpr.right, vars);
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
            } else if (binaryExpr.op === "==") {
                return leftValue === rightValue;
            } else if (binaryExpr.op === "!=") {
                return leftValue !== rightValue;
            } else if (binaryExpr.op === ">=") {
                return leftValue >= rightValue;
            } else if (binaryExpr.op === "<=") {
                return leftValue <= rightValue;
            } else if (binaryExpr.op === "<") {
                return leftValue < rightValue;
            } else if (binaryExpr.op === ">") {
                return leftValue > rightValue;
            } else if (binaryExpr.op === "&&") {
                return leftValue && rightValue;
            } else if (binaryExpr.op === "||") {
                return leftValue || rightValue;
            } else
                throw new ExprLangError(`Unexpected binary operator: '${binaryExpr.op}'`);
        } else if (expr.kind === "parenthesized") {
            const parenExpr = <Ast.ParenthesizedExpression> expr;
            const exprValue = this.evaluate(parenExpr, vars);
            return exprValue;
        } else if (expr.kind === "conditional") {
            const condExpr = <Ast.ConditionalExpression> expr;
            const condValue = this.evaluate(condExpr.condition, vars);
            const result = this.evaluate(condValue ? condExpr.whenTrue : condExpr.whenFalse, vars);
            return result;
        } else if (expr.kind === "call") {
            const callExpr = <Ast.CallExpression> expr;
            const method = this.evaluate(callExpr.method, vars);

            let thisObj;
            if (callExpr.method.kind === "propertyAccess") {
                const thisObjExpr = (<Ast.PropertyAccessExpression> callExpr.method).object;
                thisObj = this.evaluate(thisObjExpr, vars);
            } else {
                thisObj = null;
            }

            const args = callExpr.arguments.map(arg => this.evaluate(arg, vars));
            const result = this.modelHandler.methodCall(method, args, thisObj, vars);
            return result;
        } else if (expr.kind === "propertyAccess") {
            const propAccExpr = <Ast.PropertyAccessExpression> expr;
            const object = this.evaluate(propAccExpr.object, vars);
            const result = this.modelHandler.memberAccess(object, propAccExpr.propertyName, true);
            return result;
        } else if (expr.kind === "elementAccess") {
            const elemAccExpr = <Ast.ElementAccessExpression> expr;
            const object = this.evaluate(elemAccExpr.object, vars);
            const memberName = this.evaluate(elemAccExpr.elementExpr, vars);
            const result = this.modelHandler.memberAccess(object, memberName, false);
            return result;
        } else {
            throw new ExprLangError(`Unknown expression kind: '${expr.kind}'`);
        }
    }
}
