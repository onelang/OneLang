import { Enum, Method, Interface, Class } from "./Types";

export class Type { $type = "Type"; }

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

export class MethodType extends Type {
    constructor(public decl: Method) { super(); }
}

export interface IHasTypeArguments {
    typeArguments: Type[];
}

export class InterfaceType extends Type implements IHasTypeArguments {
    constructor(public decl: Interface, public typeArguments: Type[] = []) { super(); }
}

export class ClassType extends Type implements IHasTypeArguments {
    constructor(public decl: Class, public typeArguments: Type[] = []) { super(); }
}

export class UnresolvedType extends Type implements IHasTypeArguments {
    constructor(public typeName: string, public typeArguments: Type[] = []) { super(); }
}

