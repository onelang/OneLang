import { Type } from "./AstTypes";
import { Statement } from "./Statements";

export class Expression {
    parentRef?: Expression|Statement;
    valueType?: Type;
    //typeArgs?: string[];
}

export class Identifier extends Expression {
    constructor(public text: string) { super(); }
}

export class Literal extends Expression { }

export class NumericLiteral extends Literal {
    constructor(public valueAsText: string) { super(); }
}

export class BooleanLiteral extends Literal {
    constructor(public boolValue: boolean) { super(); }
}

export class CharacterLiteral extends Literal {
    constructor(public charValue: string) { super(); }
}

export class StringLiteral extends Literal {
    constructor(public stringValue: string) { super(); }
}

export class NullLiteral extends Literal { }

export class TemplateStringPart {
    constructor(
        public isLiteral: boolean,
        public literalText: string,
        public expression: Expression) { }

    static Literal(literalText: string) { return new TemplateStringPart(true, literalText, null); }
    static Expression(expr: Expression) { return new TemplateStringPart(false, null, expr); }
}

export class TemplateString extends Expression {
    constructor(public parts: TemplateStringPart[]) { super(); }
}

export class ArrayLiteral extends Expression {
    constructor(public items: Expression[]) { super(); }
}

export class MapLiteral extends Expression {
    constructor(public properties: { [name: string]: Expression }) { super(); }
}

export class NewExpression extends Expression {
    constructor(
        public cls: Type,
        public args: CallArgument[]) { super(); }
}

export class BinaryExpression extends Expression {
    constructor(
        public left: Expression,
        public operator: string,
        public right: Expression) { super(); }
}

export class UnaryExpression extends Expression {
    constructor(
        public unaryType: "postfix"|"prefix",
        public operator: string, // "++" | "--" | "+" | "-" | "~" | "!"
        public operand: Expression) { super(); }
}

export class CastExpression extends Expression {
    constructor(
        public newType: Type,
        public expression: Expression) { super(); }
}

export class ParenthesizedExpression extends Expression {
    constructor(public expression: Expression) { super(); }
}

export class ConditionalExpression extends Expression {
    constructor(
        public condition: Expression,
        public whenTrue: Expression,
        public whenFalse: Expression) { super(); }
}

export class PropertyAccessExpression extends Expression {
    constructor(
        public object: Expression,
        public propertyName: string) { super(); }
}

export class ElementAccessExpression extends Expression {
    constructor(
        public object: Expression,
        public elementExpr: Expression) { super(); }
}

export class CallExpression extends Expression {
    constructor(
        public method: Expression/*|MethodReference*/,
        public args: CallArgument[]) { super(); }
}

export class CallArgument extends Expression {
    constructor(public paramName?: string) { super(); }
}
