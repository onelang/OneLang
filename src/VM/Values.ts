export interface IVMValue { }

export class ObjectValue implements IVMValue {
    constructor(public props: { [name: string]: IVMValue }) { }
}

export class StringValue implements IVMValue {
    constructor(public value: string) { }
}

export class ArrayValue implements IVMValue {
    constructor(public items: IVMValue[]) { }
}