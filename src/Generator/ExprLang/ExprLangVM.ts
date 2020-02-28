import { LiteralExpression, IdentifierExpression, UnaryExpression, BinaryExpression, ParenthesizedExpression, ConditionalExpression, CallExpression, PropertyAccessExpression, ElementAccessExpression, IExpression } from "./ExprLangAst";

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

    evaluate(expr: IExpression, vars?: VariableContext) {
        if (expr instanceof LiteralExpression) {
            return expr.value;
        } else if (expr instanceof IdentifierExpression) {
            if (expr.text === "true") {
                return true;
            } else if (expr.text === "false") {
                return false;
            } else if (expr.text === "null") {
                return null;
            } else {
                if (!vars)
                    throw new ExprLangError(`Variable context was not set!`);

                const result = vars.getVariable(expr.text);
                return result;
            }
        } else if (expr instanceof UnaryExpression) {
            const exprValue = this.evaluate(expr.expr, vars);
            if (expr.op === "!") {
                return !exprValue;
            } else if (expr.op === "+") {
                return +exprValue;
            } else if (expr.op === "-") {
                return -exprValue;
            } else
                throw new ExprLangError(`Unexpected unary operator: '${expr.op}'`);
        } else if (expr instanceof BinaryExpression) {
            const leftValue = this.evaluate(expr.left, vars);
            const rightValue = this.evaluate(expr.right, vars);
            if (expr.op === "+") {
                return leftValue + rightValue;
            } else if (expr.op === "-") {
                return leftValue - rightValue;
            } else if (expr.op === "*") {
                return leftValue * rightValue;
            } else if (expr.op === "/") {
                return leftValue / rightValue;
            } else if (expr.op === "<<") {
                return leftValue << rightValue;
            } else if (expr.op === ">>") {
                return leftValue >> rightValue;
            } else if (expr.op === "==") {
                return leftValue === rightValue;
            } else if (expr.op === "!=") {
                return leftValue !== rightValue;
            } else if (expr.op === ">=") {
                return leftValue >= rightValue;
            } else if (expr.op === "<=") {
                return leftValue <= rightValue;
            } else if (expr.op === "<") {
                return leftValue < rightValue;
            } else if (expr.op === ">") {
                return leftValue > rightValue;
            } else if (expr.op === "&&") {
                return leftValue && rightValue;
            } else if (expr.op === "||") {
                return leftValue || rightValue;
            } else
                throw new ExprLangError(`Unexpected binary operator: '${expr.op}'`);
        } else if (expr instanceof ParenthesizedExpression) {
            const exprValue = this.evaluate(expr, vars);
            return exprValue;
        } else if (expr instanceof ConditionalExpression) {
            const condValue = this.evaluate(expr.condition, vars);
            const result = this.evaluate(condValue ? expr.whenTrue : expr.whenFalse, vars);
            return result;
        } else if (expr instanceof CallExpression) {
            const method = this.evaluate(expr.method, vars);

            let thisObj;
            if (expr.method instanceof PropertyAccessExpression) {
                const thisObjExpr = expr.method.object;
                thisObj = this.evaluate(thisObjExpr, vars);
            } else {
                thisObj = null;
            }

            const args = expr.args.map(arg => this.evaluate(arg, vars));
            const result = this.modelHandler.methodCall(method, args, thisObj, vars);
            return result;
        } else if (expr instanceof PropertyAccessExpression) {
            const object = this.evaluate(expr.object, vars);
            const result = this.modelHandler.memberAccess(object, expr.propertyName, true);
            return result;
        } else if (expr instanceof ElementAccessExpression) {
            const object = this.evaluate(expr.object, vars);
            const memberName = this.evaluate(expr.elementExpr, vars);
            const result = this.modelHandler.memberAccess(object, memberName, false);
            return result;
        } else {
            throw new ExprLangError(`Unknown expression kind: '${expr.constructor.name}'`);
        }
    }
}
