export interface IExpression {
}

export class BinaryExpression implements IExpression {
    // op == "+"|"-"|"*"|"/"|"<<"|">>";
    constructor(public op: string, public left: IExpression, public right: IExpression) { }
}

export class UnaryExpression implements IExpression {
    // "!"|"+"|"-"|"!";
    constructor(public op: string, public expr: IExpression) { }
}

export enum LiteralType { Number, String, Boolean }

export class LiteralExpression implements IExpression {
    constructor(public type: LiteralType, public value: any) { }
}

export class IdentifierExpression implements IExpression {
    constructor(public text: string) { }
}

export class ParenthesizedExpression implements IExpression {
    constructor(public expr: IExpression) { }
}

export class ConditionalExpression implements IExpression {
    constructor(public condition: IExpression, public whenTrue: IExpression, public whenFalse: IExpression) { }
}

export class CallExpression implements IExpression {
    constructor(public method: IExpression, public args: IExpression[]) { }
}

export class PropertyAccessExpression implements IExpression {
    constructor(public object: IExpression, public propertyName: string) { }
}

export class ElementAccessExpression implements IExpression {
    constructor(public object: IExpression, public elementExpr: IExpression) { }
}
