export interface IType {
    repr(): string;
    clone(): IType;
}

export interface IExpression {
    setActualType(actualType: IType, allowVoid: boolean, allowGeneric: boolean): void;
    setExpectedType(type: IType, allowVoid: boolean): void;
    getType(): IType;
    clone(): IExpression;
}
