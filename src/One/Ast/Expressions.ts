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

    cloneTo(expr: Expression) { 
        expr.actualType = this.actualType.clone();
        expr.expectedType = this.expectedType.clone();
    }
}

export class Identifier extends Expression {
    constructor(public text: string) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new Identifier(this.text);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class NumericLiteral extends Expression {
    constructor(public valueAsText: string) { super(); }
    copy(): IExpression { return new NumericLiteral(this.valueAsText); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new NumericLiteral(this.valueAsText);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class BooleanLiteral extends Expression {
    constructor(public boolValue: boolean) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new BooleanLiteral(this.boolValue);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class CharacterLiteral extends Expression {
    constructor(public charValue: string) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new CharacterLiteral(this.charValue);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class StringLiteral extends Expression {
    constructor(public stringValue: string) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new StringLiteral(this.stringValue);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class NullLiteral extends Expression {
    clone() { return new NullLiteral(); }
}

export class RegexLiteral extends Expression {
    constructor(
        public pattern: string,
        public caseInsensitive: boolean,
        public global: boolean) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new RegexLiteral(this.pattern, this.caseInsensitive, this.global);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class TemplateStringPart implements IAstNode {
    constructor(
        public isLiteral: boolean,
        public literalText: string,
        public expression: Expression) { }

    static Literal(literalText: string): TemplateStringPart { return new TemplateStringPart(true, literalText, null); }
    static Expression(expr: Expression): TemplateStringPart { return new TemplateStringPart(false, null, expr); }

    // #region @auto-generated generate-ast-helper-code
    clone() { return new TemplateStringPart(this.isLiteral, this.literalText, this.expression.clone()); }
    // #endregion
}

export class TemplateString extends Expression {
    constructor(public parts: TemplateStringPart[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new TemplateString(this.parts.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ArrayLiteral extends Expression {
    constructor(public items: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ArrayLiteral(this.items.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class MapLiteralItem implements IAstNode {
    constructor(public key: string, public value: Expression) { }

    // #region @auto-generated generate-ast-helper-code
    clone() { return new MapLiteralItem(this.key, this.value.clone()); }
    // #endregion
}

export class MapLiteral extends Expression {
    constructor(public items: MapLiteralItem[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new MapLiteral(this.items.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class UnresolvedNewExpression extends Expression {
    constructor(
        public cls: UnresolvedType,
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new UnresolvedNewExpression(this.cls.clone(), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class NewExpression extends Expression {
    constructor(
        public cls: ClassType,
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new NewExpression(this.cls.clone(), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class BinaryExpression extends Expression {
    constructor(
        public left: Expression,
        public operator: string,
        public right: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new BinaryExpression(this.left.clone(), this.operator, this.right.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class NullCoalesceExpression extends Expression {
    constructor(
        public defaultExpr: Expression,
        public exprIfNull: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new NullCoalesceExpression(this.defaultExpr.clone(), this.exprIfNull.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export enum UnaryType { Postfix, Prefix }

export class UnaryExpression extends Expression {
    constructor(
        public unaryType: UnaryType,
        public operator: string, // "++" | "--" | "+" | "-" | "~" | "!"
        public operand: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new UnaryExpression(this.unaryType, this.operator, this.operand.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class CastExpression extends Expression {
    constructor(
        public newType: IType,
        public expression: Expression) { super(); }

    // in case the cast is an implicit cast happening because of an "instanceof" primitive
    /** @creator InstanceOfImplicitCast */
    instanceOfCast: InstanceOfExpression;

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new CastExpression(this.newType.clone(), this.expression.clone());
        result.instanceOfCast = this.instanceOfCast.clone();
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ParenthesizedExpression extends Expression {
    constructor(public expression: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ParenthesizedExpression(this.expression.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ConditionalExpression extends Expression {
    constructor(
        public condition: Expression,
        public whenTrue: Expression,
        public whenFalse: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ConditionalExpression(this.condition.clone(), this.whenTrue.clone(), this.whenFalse.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class PropertyAccessExpression extends Expression {
    constructor(
        public object: Expression,
        public propertyName: string) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new PropertyAccessExpression(this.object.clone(), this.propertyName);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ElementAccessExpression extends Expression {
    constructor(
        public object: Expression,
        public elementExpr: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ElementAccessExpression(this.object.clone(), this.elementExpr.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class UnresolvedCallExpression extends Expression {
    constructor(
        public func: Expression,
        public typeArgs: IType[],
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new UnresolvedCallExpression(this.func.clone(), this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class UnresolvedMethodCallExpression extends Expression {
    constructor(
        public object: Expression,
        public methodName: string,
        public typeArgs: IType[],
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new UnresolvedMethodCallExpression(this.object.clone(), this.methodName, this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
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

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new StaticMethodCallExpression(this.method.clone(), this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone()), this.isThisCall);
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class InstanceMethodCallExpression extends Expression implements IMethodCallExpression {
    constructor(
        public object: Expression,
        public method: Method,
        public typeArgs: IType[],
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new InstanceMethodCallExpression(this.object.clone(), this.method.clone(), this.typeArgs.map(x => x.clone()), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class GlobalFunctionCallExpression extends Expression {
    constructor(
        public func: GlobalFunction,
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new GlobalFunctionCallExpression(this.func.clone(), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class LambdaCallExpression extends Expression {
    constructor(
        public method: Expression,
        public args: Expression[]) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new LambdaCallExpression(this.method.clone(), this.args.map(x => x.clone()));
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class TodoExpression extends Expression {
    constructor(
        public expr: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new TodoExpression(this.expr.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class InstanceOfExpression extends Expression { 
    constructor(
        public expr: Expression,
        public checkType: IType) { super(); }

    // list of all the implicit casts happening because of this instanceof
    /** @creator InstanceOfImplicitCast */
    implicitCasts: CastExpression[] = null;

    alias: string = null;

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new InstanceOfExpression(this.expr.clone(), this.checkType.clone());
        result.implicitCasts = this.implicitCasts.map(x => x.clone());
        result.alias = this.alias;
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class AwaitExpression extends Expression {
    constructor(public expr: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new AwaitExpression(this.expr.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}