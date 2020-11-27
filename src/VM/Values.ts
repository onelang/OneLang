export interface IVMValue {
    equals(other: IVMValue): boolean;
}

export interface ICallableValue extends IVMValue {
    call(args: IVMValue[]): IVMValue;
}

export class ObjectValue implements IVMValue {
    constructor(public props: { [name: string]: IVMValue }) { }
    equals(other: IVMValue): boolean { return false; }
}

export class StringValue implements IVMValue {
    constructor(public value: string) { }
    
    equals(other: IVMValue): boolean {
        return other instanceof StringValue && other.value === this.value;
    }
}

export class NumericValue implements IVMValue {
    constructor(public value: number) { }

    equals(other: IVMValue): boolean {
        return other instanceof NumericValue && other.value === this.value;
    }
}

export class BooleanValue implements IVMValue {
    constructor(public value: boolean) { }

    equals(other: IVMValue): boolean {
        return other instanceof BooleanValue && other.value === this.value;
    }
}

export class ArrayValue implements IVMValue {
    constructor(public items: IVMValue[]) { }
    equals(other: IVMValue): boolean { return false; }
}