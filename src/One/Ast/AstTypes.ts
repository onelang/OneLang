import { Enum, Method, Interface, Class, IImportable, MethodParameter } from "./Types";

export interface IType { }
export interface ICreatableType extends IType { }
export class Type implements IType { }

export class PrimitiveType extends Type { }

export class VoidType extends PrimitiveType { }
export class AnyType extends PrimitiveType { }
export class NullType extends PrimitiveType { }

export class GenericsType extends Type {
    constructor(public typeVarName: string) { super(); }
}

export class EnumType extends Type {
    constructor(public decl: Enum) { super(); }
}

export interface IHasTypeArguments {
    typeArguments: Type[];
}

export class InterfaceType extends Type implements IHasTypeArguments {
    constructor(public decl: Interface, public typeArguments: Type[] = []) { super(); }
}

export class ClassType extends Type implements IHasTypeArguments, ICreatableType {
    constructor(public decl: Class, public typeArguments: Type[] = []) { super(); }
}

export class UnresolvedType extends Type implements IHasTypeArguments, ICreatableType {
    constructor(public typeName: string, public typeArguments: Type[] = []) { super(); }
}

export class LambdaType extends Type {
    constructor(public parameters: MethodParameter[], public returnType: Type) { super(); }
}
