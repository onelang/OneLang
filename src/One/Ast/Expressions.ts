import { Type, ICreatableType, VoidType, UnresolvedType } from "./AstTypes";
import { Statement } from "./Statements";
import { MethodParameter, Method } from "./Types";
import { StaticMethodReference } from "./References";

export enum TypeRestriction { NoRestriction, ShouldNotHaveType, MustBeGeneric, ShouldNotBeGeneric }

export class Expression {
    /** @creator FillParent */
    parentExpr: Expression;
    /** @creator InferTypes */
    exprType: Type = null;

    setType(type: Type, allowUnresolved = false) {
        if (this.exprType !== null) throw new Error("Expression already has type!");
        if (type === null) throw new Error("New type cannot be null!");

        if (type instanceof VoidType) throw new Error("Expression's type cannot be VoidType!");
        if (type instanceof UnresolvedType && !allowUnresolved) throw new Error("Expression's type cannot be UnresolvedType!");

        this.exprType = type;
    }
}

export class ExpressionRoot extends Expression {
    constructor(public root: Expression) {
        super();
        if (root.parentExpr !== null)
            throw new Error("Expected parentExpr to be null!");
        root.parentExpr = this;
    }
}

export class Identifier extends Expression {
    constructor(public text: string) { super(); }
}

export class NumericLiteral extends Expression {
    constructor(public valueAsText: string) { super(); }
}

export class BooleanLiteral extends Expression {
    constructor(public boolValue: boolean) { super(); }
}

export class CharacterLiteral extends Expression {
    constructor(public charValue: string) { super(); }
}

export class StringLiteral extends Expression {
    constructor(public stringValue: string) { super(); }
}

export class NullLiteral extends Expression { }

export class RegexLiteral extends Expression {
    constructor(
        public pattern: string,
        public caseInsensitive: boolean,
        public global: boolean) { super(); }
}

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
    constructor(public properties: Map<string, Expression>) { super(); }
}

export class NewExpression extends Expression {
    constructor(
        public cls: ICreatableType,
        public args: Expression[]) { super(); }
}

export class BinaryExpression extends Expression {
    constructor(
        public left: Expression,
        public operator: string,
        public right: Expression) { super(); }
}

export enum UnaryType { Postfix, Prefix }

export class UnaryExpression extends Expression {
    constructor(
        public unaryType: UnaryType,
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

export class UnresolvedCallExpression extends Expression {
    constructor(
        public method: Expression,
        public typeArgs: Type[],
        public args: Expression[]) { super(); }
}

export class StaticMethodCallExpression extends Expression {
    constructor(
        public method: Method,
        public typeArgs: Type[],
        public args: Expression[]) { super(); }
}

export class InstanceMethodCallExpression extends Expression {
    constructor(
        public object: Expression,
        public method: Method,
        public typeArgs: Type[],
        public args: Expression[]) { super(); }
}

export class InstanceOfExpression extends Expression { 
    constructor(
        public expr: Expression,
        public type: Type) { super(); }
}

export class AwaitExpression extends Expression {
    constructor(public expr: Expression) { super(); }
}