export interface IType {
    repr(): string;
}

export interface IExpression {
    setActualType(actualType: IType, allowVoid: boolean, allowGeneric: boolean): void;
    setExpectedType(type: IType, allowVoid: boolean): void;
    getType(): IType;
    copy(): IExpression;
}
