import { Type, VoidType, UnresolvedType, ClassType } from "./AstTypes";
import { Method, GlobalFunction, IAstNode } from "./Types";

export enum TypeRestriction { NoRestriction, ShouldNotHaveType, MustBeGeneric, ShouldNotBeGeneric }

export class Expression implements IAstNode {
    /** @creator FillParent */
    parentNode: IAstNode = null;
    /** @creator InferTypes */
    expectedType: Type = null;
    /** @creator InferTypes */
    actualType: Type = null;
    actualTypeStack: string = null;

    protected typeCheck(type: Type, allowVoid: boolean) {
        if (type === null)
            throw new Error("New type cannot be null!");

        if (type instanceof VoidType && !allowVoid)
            throw new Error("Expression's type cannot be VoidType!");

        if (type instanceof UnresolvedType)
            throw new Error("Expression's type cannot be UnresolvedType!");
    }

    setActualType(actualType: Type, allowVoid = false, allowGeneric = false) {
        if (this.actualType !== null)
            throw new Error(`Expression already has actual type (current type = ${this.actualType.repr()}, new type = ${actualType.repr()})`);

        this.typeCheck(actualType, allowVoid);

        if (this.expectedType !== null && !Type.isAssignableTo(actualType, this.expectedType))
            throw new Error(`Actual type (${actualType.repr()}) is not assignable to the declared type (${this.expectedType.repr()})!`);

        if (!allowGeneric && Type.isGeneric(actualType))
            throw new Error(`Actual type cannot be generic (${actualType.repr()})!`);

        this.actualType = actualType;
        // TODO: debug only
        Error.stackTraceLimit = 999;
        this.actualTypeStack = (new Error()).stack;
    }

    setExpectedType(type: Type, allowVoid = false) {
        if (this.actualType !== null)
            throw new Error("Cannot set expected type after actual type was already set!");

        if (this.expectedType !== null)
            throw new Error("Expression already has a expected type!");

        this.typeCheck(type, allowVoid);

        this.expectedType = type;
    }

    getType() { return this.actualType || this.expectedType; }
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

export class MapLiteralItem {
    constructor(public key: string, public value: Expression) { }
}

export class MapLiteral extends Expression {
    constructor(public items: MapLiteralItem[]) { super(); }
}

export class UnresolvedNewExpression extends Expression {
    constructor(
        public cls: UnresolvedType,
        public args: Expression[]) { super(); }
}

export class NewExpression extends Expression {
    constructor(
        public cls: ClassType,
        public args: Expression[]) { super(); }
}

export class BinaryExpression extends Expression {
    constructor(
        public left: Expression,
        public operator: string,
        public right: Expression) { super(); }
}

export class NullCoalesceExpression extends Expression {
    constructor(
        public defaultExpr: Expression,
        public exprIfNull: Expression) { super(); }
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
        public expression: Expression,
        public implicit: boolean = false) { super(); }
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
        public func: Expression,
        public typeArgs: Type[],
        public args: Expression[]) { super(); }
}

export class UnresolvedMethodCallExpression extends Expression {
    constructor(
        public object: Expression,
        public methodName: string,
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

export class GlobalFunctionCallExpression extends Expression {
    constructor(
        public func: GlobalFunction,
        public args: Expression[]) { super(); }
}

export class LambdaCallExpression extends Expression {
    constructor(
        public method: Expression,
        public args: Expression[]) { super(); }
}

export class TodoExpression extends Expression {
    constructor(
        public expr: Expression) { super(); }
}

export class InstanceOfExpression extends Expression { 
    constructor(
        public expr: Expression,
        public checkType: Type) { super(); }
}

export class AwaitExpression extends Expression {
    constructor(public expr: Expression) { super(); }
}