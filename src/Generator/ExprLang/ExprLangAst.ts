export interface Expression {
    kind: "binary"|"unary"|"literal"|"identifier"|"parenthesized"|"conditional"|"call"|"propertyAccess"|"elementAccess";
}

export interface BinaryExpression extends Expression {
    kind: "binary";
    op: "+"|"-"|"*"|"/"|"<<"|">>";
    left: Expression;
    right: Expression;
}

export interface UnaryExpression extends Expression {
    kind: "unary";
    op: "!"|"+"|"-"|"!";
    expr: Expression;
}

export interface LiteralExpression extends Expression {
    kind: "literal";
    type: "number"|"string"|"boolean";
    value: any;
}

export interface IdentifierExpression extends Expression {
    kind: "identifier";
    text: string;
}

export interface ParenthesizedExpression extends Expression {
    kind: "parenthesized";
    expr: Expression;
}

export interface ConditionalExpression extends Expression {
    kind: "conditional";
    condition: Expression;
    whenTrue: Expression;
    whenFalse: Expression;
}

export interface CallExpression extends Expression {
    kind: "call";
    method: Expression;
    arguments: Expression[];
}

export interface PropertyAccessExpression extends Expression {
    kind: "propertyAccess";
    object: Expression;
    propertyName: string;
}

export interface ElementAccessExpression extends Expression {
    kind: "elementAccess";
    object: Expression;
    elementExpr: Expression;
}
