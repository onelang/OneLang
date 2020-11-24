import { Expression, Identifier, PropertyAccessExpression, StringLiteral, UnresolvedCallExpression } from "../One/Ast/Expressions";
import { ICallableValue, IVMValue, ObjectValue, StringValue } from "./Values";

export class ExprVM {
    constructor(public model: ObjectValue) { }

    static propAccess(obj: IVMValue, propName: string): IVMValue { 
        if (!(obj instanceof ObjectValue)) throw new Error("You can only access a property of an object!");
        if (!(propName in (<ObjectValue>obj).props)) throw new Error(`Property '${propName}' does not exists on this object!`);
        return (<ObjectValue>obj).props[propName];
    }

    evaluate(expr: Expression): IVMValue {
        if (expr instanceof Identifier) {
            return ExprVM.propAccess(this.model, expr.text);
        } else if (expr instanceof PropertyAccessExpression) {
            const objValue = this.evaluate(expr.object);
            return ExprVM.propAccess(objValue, expr.propertyName);
        } else if (expr instanceof UnresolvedCallExpression) {
            const func = <ICallableValue> this.evaluate(expr.func);
            const args = expr.args.map(x => this.evaluate(x));
            const result = func.call(args);
            return result;
        } else if (expr instanceof StringLiteral) {
            return new StringValue(expr.stringValue);
        } else 
            throw new Error("Unsupported expression!");
    }
}