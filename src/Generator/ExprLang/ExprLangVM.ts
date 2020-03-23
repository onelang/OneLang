import { LiteralExpression, IdentifierExpression, UnaryExpression, BinaryExpression, ParenthesizedExpression, ConditionalExpression, CallExpression, PropertyAccessExpression, ElementAccessExpression, IExpression } from "./ExprLangAst";

class ExprLangError extends Error {
    constructor(msg: string) { super(msg); }
}

export interface IModelHandler {
    methodCall(method: Function, args: any[], thisObj: any, model: any): any;
    memberAccess(obj: any, memberName: any, isProperty: boolean): any;
}

export class JSModelHandler implements IModelHandler {
    static methodCallG(method: Function, args: any[], thisObj: any, model: any): any {
        if (!(typeof method === "function"))
            throw new ExprLangError(`Tried to call a non-method value: '${method}'`); //  (${typeof method})
        const result = method.apply(thisObj, args);
        return result;
    }

    static memberAccessG(obj: any, memberName: any, isProperty: boolean): any {
        if (!(typeof obj === "object"))
            throw new ExprLangError(`Expected object for accessing member: (${obj})`);

        if (!(memberName in obj))
            //throw new ExprLangError(`Member '${memberName}' not found in object '${obj.constructor.name}' (${typeof obj})`);
            return null;

        return obj[memberName];
    }

    methodCall(method: any, args: any[], thisObj: any, model: any) {
        return JSModelHandler.methodCallG(method, args, thisObj, model);
    }

    memberAccess(obj: any, memberName: any, isProperty: boolean) {
        return JSModelHandler.memberAccessG(obj, memberName, isProperty);
    }
}

export class VariableSource {
    vars: { [varName: string]: any } = {};
    callbacks: { [varName: string]: () => any } = {};

    constructor(public name: string) { }

    checkUnique(varName: string, allowOverwrite = false) {
        if (varName === null)
            throw new ExprLangError("Variable name is missing!");

        if (!(typeof varName === "string"))
            throw new ExprLangError(`Expected string as variable name!`);

        if (varName in this.callbacks)
            throw new ExprLangError(`Callback was already set for variable '${varName}'`);

        if (!allowOverwrite && varName in this.vars)
            throw new ExprLangError(`Variable '${varName}' was already set`);
    }

    addCallback(varName: string, callback: () => any): void {
        this.checkUnique(varName);
        this.callbacks[varName] = callback;
    }

    setVariable(varName: string, value: any, allowOverwrite: boolean = false): void {
        this.checkUnique(varName, allowOverwrite);
        this.vars[varName] = value;
    }
    
    getVariable(varName: string) {
        let result: any = null;

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

    static createSingle(varName: string, value: any, sourceName: string) {
        const source = new VariableSource(sourceName || `var: ${varName}`);
        source.setVariable(varName, value);
        return source;
    }

    static fromObject(obj: any, sourceName: string) {
        const source = new VariableSource(sourceName || `object`);
        if (obj)
            for (const key of Object.keys(obj))
                source.setVariable(key, obj[key]);
        return source;
    }
}

export class VariableContext {
    constructor(public sources: VariableSource[] = []) { }

    inherit(newSource: VariableSource): VariableContext {
        return new VariableContext([newSource].concat(this.sources));
    }

    getVariable(varName: string): any {
        for (const source of this.sources) {
            const result: any = source.getVariable(varName);
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

    constructor(modelHandler: IModelHandler = null) {
        this.modelHandler = modelHandler || new JSModelHandler();
    }

    evaluate(expr: IExpression, vars: VariableContext = null): any {
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
                if (vars === null)
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

            let thisObj = null;
            if (expr.method instanceof PropertyAccessExpression) {
                const thisObjExpr = expr.method.object;
                thisObj = this.evaluate(thisObjExpr, vars);
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
            throw new ExprLangError(`Unknown expression kind: '${expr}'`);
        }
    }
}
