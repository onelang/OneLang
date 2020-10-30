import { VoidType, UnresolvedType, ClassType, TypeHelper } from "./AstTypes";
// @python-ignore
import { Method, GlobalFunction, IAstNode } from "./Types";
import { IExpression, IType } from "./Interfaces";

export enum TypeRestriction { NoRestriction, ShouldNotHaveType, MustBeGeneric, ShouldNotBeGeneric }

export abstract class Expression implements IAstNode, IExpression {
    /** @creator FillParent */
    parentNode: IAstNode = null;
    /** @creator InferTypes */
    expectedType: IType = null;
    /** @creator InferTypes */
    actualType: IType = null;

    protected typeCheck(type: IType, allowVoid: boolean): void {
        if (type === null)
            throw new Error("New type cannot be null!");

        if (type instanceof VoidType && !allowVoid)
            throw new Error("Expression's type cannot be VoidType!");

        if (type instanceof UnresolvedType)
            throw new Error("Expression's type cannot be UnresolvedType!");
    }

    setActualType(actualType: IType, allowVoid = false, allowGeneric = false): void {
        if (this.actualType !== null)
            throw new Error(`Expression already has actual type (current type = ${this.actualType.repr()}, new type = ${actualType.repr()})`);

        this.typeCheck(actualType, allowVoid);

        if (this.expectedType !== null && !TypeHelper.isAssignableTo(actualType, this.expectedType))
            throw new Error(`Actual type (${actualType.repr()}) is not assignable to the declared type (${this.expectedType.repr()})!`);

        // TODO: decide if this check needed or not
        //if (!allowGeneric && TypeHelper.isGeneric(actualType))
        //    throw new Error(`Actual type cannot be generic (${actualType.repr()})!`);

        this.actualType = actualType;
    }

    setExpectedType(type: IType, allowVoid = false): void {
        if (this.actualType !== null)
            throw new Error("Cannot set expected type after actual type was already set!");

        if (this.expectedType !== null)
            throw new Error("Expression already has a expected type!");

        this.typeCheck(type, allowVoid);

        this.expectedType = type;
    }

    getType(): IType { return this.actualType || this.expectedType; }

    abstract clone(): Expression;
}

export class Identifier extends Expression {
    constructor(public text: string) { super(); }

    // @auto-generated
    clone() { return new Identifier(this.text); }
}

export class NumericLiteral extends Expression {
    constructor(public valueAsText: string) { super(); }
    copy(): IExpression { return new NumericLiteral(this.valueAsText); }

    // @auto-generated
    clone() { return new NumericLiteral(this.valueAsText); }
}

export class BooleanLiteral extends Expression {
    constructor(public boolValue: boolean) { super(); }

    // @auto-generated
    clone() { return new BooleanLiteral(this.boolValue); }
}

export class CharacterLiteral extends Expression {
    constructor(public charValue: string) { super(); }

    // @auto-generated
    clone() { return new CharacterLiteral(this.charValue); }
}

export class StringLiteral extends Expression {
    constructor(public stringValue: string) { super(); }

    // @auto-generated
    clone() { return new StringLiteral(this.stringValue); }
}

export class NullLiteral extends Expression {
    clone() { return new NullLiteral(); }
}

export class RegexLiteral extends Expression {
    constructor(
        public pattern: string,
        public caseInsensitive: boolean,
        public global: boolean) { super(); }

    // @auto-generated
    clone() { return new RegexLiteral(this.pattern, this.caseInsensitive, this.global); }
}

export class TemplateStringPart implements IAstNode {
    constructor(
        public isLiteral: boolean,
        public literalText: string,
        public expression: Expression) { }

    static Literal(literalText: string): TemplateStringPart { return new TemplateStringPart(true, literalText, null); }
    static Expression(expr: Expression): TemplateStringPart { return new TemplateStringPart(false, null, expr); }

    // @auto-generated
    clone() { return new TemplateStringPart(this.isLiteral, this.literalText, this.expression.clone()); }
}

export class TemplateString extends Expression {
    constructor(public parts: TemplateStringPart[]) { super(); }

    // @auto-generated
    clone() { return new TemplateString(this.parts.map(x => x.clone())); }
}

export class ArrayLiteral extends Expression {
    constructor(public items: Expression[]) { super(); }

    // @auto-generated
    clone() { return new ArrayLiteral(this.items.map(x => x.clone())); }
}

export class MapLiteralItem implements IAstNode {
    constructor(public key: string, public value: Expression) { }

    // @auto-generated
    clone() { return new MapLiteralItem(this.key, this.value.clone()); }
}

export class MapLiteral extends Expression {
    constructor(public items: MapLiteralItem[]) { super(); }

    // @auto-generated
    clone() { return new MapLiteral(this.items.map(x => x.clone())); }
}

export class UnresolvedNewExpression extends Expression {
    constructor(
        public cls: UnresolvedType,
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new UnresolvedNewExpression(this.cls.clone(), this.args.map(x => x.clone())); }
}

export class NewExpression extends Expression {
    constructor(
        public cls: ClassType,
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new NewExpression(this.cls.clone(), this.args.map(x => x.clone())); }
}

export class BinaryExpression extends Expression {
    constructor(
        public left: Expression,
        public operator: string,
        public right: Expression) { super(); }

    // @auto-generated
    clone() { return new BinaryExpression(this.left.clone(), this.operator, this.right.clone()); }
}

export class NullCoalesceExpression extends Expression {
    constructor(
        public defaultExpr: Expression,
        public exprIfNull: Expression) { super(); }

    // @auto-generated
    clone() { return new NullCoalesceExpression(this.defaultExpr.clone(), this.exprIfNull.clone()); }
}

export enum UnaryType { Postfix, Prefix }

export class UnaryExpression extends Expression {
    constructor(
        public unaryType: UnaryType,
        public operator: string, // "++" | "--" | "+" | "-" | "~" | "!"
        public operand: Expression) { super(); }

    // @auto-generated
    clone() { return new UnaryExpression(this.unaryType, this.operator, this.operand.clone()); }
}

export class CastExpression extends Expression {
    constructor(
        public newType: IType,
        public expression: Expression) { super(); }

    // in case the cast is an implicit cast happening because of an "instanceof" primitive
    /** @creator InstanceOfImplicitCast */
    instanceOfCast: InstanceOfExpression;

    // @auto-generated
    clone() { return new CastExpression(this.newType.clone(), this.expression.clone()); }
}

export class ParenthesizedExpression extends Expression {
    constructor(public expression: Expression) { super(); }

    // @auto-generated
    clone() { return new ParenthesizedExpression(this.expression.clone()); }
}

export class ConditionalExpression extends Expression {
    constructor(
        public condition: Expression,
        public whenTrue: Expression,
        public whenFalse: Expression) { super(); }

    // @auto-generated
    clone() { return new ConditionalExpression(this.condition.clone(), this.whenTrue.clone(), this.whenFalse.clone()); }
}

export class PropertyAccessExpression extends Expression {
    constructor(
        public object: Expression,
        public propertyName: string) { super(); }

    // @auto-generated
    clone() { return new PropertyAccessExpression(this.object.clone(), this.propertyName); }
}

export class ElementAccessExpression extends Expression {
    constructor(
        public object: Expression,
        public elementExpr: Expression) { super(); }

    // @auto-generated
    clone() { return new ElementAccessExpression(this.object.clone(), this.elementExpr.clone()); }
}

export class UnresolvedCallExpression extends Expression {
    constructor(
        public func: Expression,
        public typeArgs: IType[],
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new UnresolvedCallExpression(this.func.clone(), this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone())); }
}

export class UnresolvedMethodCallExpression extends Expression {
    constructor(
        public object: Expression,
        public methodName: string,
        public typeArgs: IType[],
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new UnresolvedMethodCallExpression(this.object.clone(), this.methodName, this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone())); }
}

export interface IMethodCallExpression extends IExpression {
    method: Method;
    typeArgs: IType[];
    args: Expression[];
}

export class StaticMethodCallExpression extends Expression implements IMethodCallExpression {
    constructor(
        public method: Method,
        public typeArgs: IType[],
        public args: Expression[],
        public isThisCall: boolean) { super(); }

    // @auto-generated
    clone() { return new StaticMethodCallExpression(this.method.clone(), this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone()), this.isThisCall); }
}

export class InstanceMethodCallExpression extends Expression implements IMethodCallExpression {
    constructor(
        public object: Expression,
        public method: Method,
        public typeArgs: IType[],
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new InstanceMethodCallExpression(this.object.clone(), this.method.clone(), this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone())); }
}

export class GlobalFunctionCallExpression extends Expression {
    constructor(
        public func: GlobalFunction,
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new GlobalFunctionCallExpression(this.func.clone(), this.args.map(x => x.clone())); }
}

export class LambdaCallExpression extends Expression {
    constructor(
        public method: Expression,
        public args: Expression[]) { super(); }

    // @auto-generated
    clone() { return new LambdaCallExpression(this.method.clone(), this.args.map(x => x.clone())); }
}

export class TodoExpression extends Expression {
    constructor(
        public expr: Expression) { super(); }

    // @auto-generated
    clone() { return new TodoExpression(this.expr.clone()); }
}

export class InstanceOfExpression extends Expression { 
    constructor(
        public expr: Expression,
        public checkType: IType) { super(); }

    // list of all the implicit casts happening because of this instanceof
    /** @creator InstanceOfImplicitCast */
    implicitCasts: CastExpression[] = null;

    alias: string = null;

    // @auto-generated
    clone() { return new InstanceOfExpression(this.expr.clone(), this.checkType.clone()); }
}

export class AwaitExpression extends Expression {
    constructor(public expr: Expression) { super(); }

    // @auto-generated
    clone() { return new AwaitExpression(this.expr.clone()); }
}