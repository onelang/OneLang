import { Enum, Method, Interface, Class, IImportable, MethodParameter, IInterface } from "./Types";

export interface IType {
    repr(): string;
}

export class Type implements IType {
    static isGeneric(type: Type): boolean {
        if (type instanceof GenericsType)
            return true;
        else if (type instanceof ClassType)
            return type.typeArguments.some(x => Type.isGeneric(x));
        else if (type instanceof InterfaceType)
            return type.typeArguments.some(x => Type.isGeneric(x));
        else if (type instanceof LambdaType)
            return type.parameters.some(x => Type.isGeneric(x.type)) || Type.isGeneric(type.returnType);
    }

    static equals(type1: Type, type2: Type): boolean {
        if (type1 === null || type2 === null) throw new Error("Type is missing!");
        if (type1 instanceof VoidType && type2 instanceof VoidType) return true;
        if (type1 instanceof AnyType && type2 instanceof AnyType) return true;
        if (type1 instanceof GenericsType && type2 instanceof GenericsType) return type1.typeVarName === type2.typeVarName;
        if (type1 instanceof EnumType && type2 instanceof EnumType) return type1.decl === type2.decl;
        if (type1 instanceof LambdaType && type2 instanceof LambdaType)
            return this.equals(type1.returnType, type2.returnType) &&
                type1.parameters.length === type2.parameters.length &&
                type1.parameters.every((t, i) => Type.equals(t.type, type2.parameters[i].type));
        if (type1 instanceof ClassType && type2 instanceof ClassType)
            return type1.decl === type2.decl && 
                type1.typeArguments.length === type2.typeArguments.length &&
                type1.typeArguments.every((t, i) => Type.equals(t, type2.typeArguments[i]));
        if (type1 instanceof InterfaceType && type2 instanceof InterfaceType)
            return type1.decl === type2.decl && 
                type1.typeArguments.length === type2.typeArguments.length &&
                type1.typeArguments.every((t, i) => Type.equals(t, type2.typeArguments[i]));
        return false;
    }

    static isAssignableTo(toBeAssigned: Type, whereTo: Type): boolean {
        // AnyType can assigned to any type except to void
        if (toBeAssigned instanceof AnyType && !(whereTo instanceof VoidType)) return true;
        // any type can assigned to AnyType except void
        if (whereTo instanceof AnyType && !(toBeAssigned instanceof VoidType)) return true;
        // any type can assigned to GenericsType except void
        if (whereTo instanceof GenericsType && !(toBeAssigned instanceof VoidType)) return true;

        if (this.equals(toBeAssigned, whereTo)) return true;

        if (toBeAssigned instanceof ClassType && whereTo instanceof ClassType)
            return (toBeAssigned.decl.baseClass !== null && this.isAssignableTo(toBeAssigned.decl.baseClass, whereTo)) ||
                toBeAssigned.decl === whereTo.decl && toBeAssigned.typeArguments.every((x, i) => this.isAssignableTo(x, whereTo.typeArguments[i]));
        if (toBeAssigned instanceof ClassType && whereTo instanceof InterfaceType)
            return toBeAssigned.decl.baseInterfaces.some(x => this.isAssignableTo(x, whereTo));
        if (toBeAssigned instanceof InterfaceType && whereTo instanceof InterfaceType)
            return toBeAssigned.decl.baseInterfaces.some(x => this.isAssignableTo(x, whereTo));
        if (toBeAssigned instanceof LambdaType && whereTo instanceof LambdaType)
            return toBeAssigned.parameters.length === whereTo.parameters.length &&
                toBeAssigned.parameters.every((p, i) => Type.isAssignableTo(p.type, whereTo.parameters[i].type)) &&
                (Type.isAssignableTo(toBeAssigned.returnType, whereTo.returnType) || whereTo.returnType instanceof GenericsType);

        return false;
    }

    repr(): string { return "U:UNKNOWN"; }
}

class TypeHelper {
    static argsRepr(args: Type[]) {
        return args.length === 0 ? "" : `<${args.map(x => x.repr()).join(", ")}>`;
    }
}

export class PrimitiveType extends Type { }

export class VoidType extends PrimitiveType {
    static instance = new VoidType();
    repr() { return "Void"; }
}

export class AmbiguousType extends Type {
    static instance = new AmbiguousType();
    rerp() { return "Ambiguous"; }
} 

export class AnyType extends PrimitiveType {
    static instance = new AnyType();
    repr() { return "Any"; }
}

export class GenericsType extends Type {
    constructor(public typeVarName: string) { super(); }
    repr() { return `G:${this.typeVarName}`; }
}

export class EnumType extends Type {
    constructor(public decl: Enum) { super(); }
    repr() { return `E:${this.decl.name}`; }
}

export interface IHasTypeArguments {
    typeArguments: Type[];
}

export interface IInterfaceType extends IType {
    decl: IInterface;
    typeArguments: Type[];
}

export class InterfaceType extends Type implements IHasTypeArguments, IInterfaceType {
    constructor(public decl: Interface, public typeArguments: Type[] = []) { super(); }
    repr() { return `I:${this.decl.name}${TypeHelper.argsRepr(this.typeArguments)}`; }
}

export class ClassType extends Type implements IHasTypeArguments, IInterfaceType {
    constructor(public decl: Class, public typeArguments: Type[] = []) { super(); }
    repr() { return `C:${this.decl.name}${TypeHelper.argsRepr(this.typeArguments)}`; }
}

export class UnresolvedType extends Type implements IHasTypeArguments {
    constructor(public typeName: string, public typeArguments: Type[] = []) { super(); }
    repr() { return `X:${this.typeName}${TypeHelper.argsRepr(this.typeArguments)}`; }
}

export class LambdaType extends Type {
    constructor(public parameters: MethodParameter[], public returnType: Type) { super();
        if (returnType === null) debugger;
    }
    repr() { return `L:(${this.parameters.map(x => x.type.repr()).join(", ")})=>${this.returnType.repr()}`; }
}
