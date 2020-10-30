// @python-ignore
import { Enum, Interface, Class, MethodParameter, IInterface } from "./Types";
import { IType } from "./Interfaces";

export class TypeHelper {
    static argsRepr(args: IType[]) {
        return args.length === 0 ? "" : `<${args.map(x => x.repr()).join(", ")}>`;
    }

    static isGeneric(type: IType): boolean {
        if (type instanceof GenericsType)
            return true;
        else if (type instanceof ClassType)
            return type.typeArguments.some(x => this.isGeneric(x));
        else if (type instanceof InterfaceType)
            return type.typeArguments.some(x => this.isGeneric(x));
        else if (type instanceof LambdaType)
            return type.parameters.some(x => this.isGeneric(x.type)) || this.isGeneric(type.returnType);
        else
            return false;
    }

    static equals(type1: IType, type2: IType): boolean {
        if (type1 === null || type2 === null)
            throw new Error("Type is missing!");
        if (type1 instanceof VoidType && type2 instanceof VoidType) return true;
        if (type1 instanceof AnyType && type2 instanceof AnyType) return true;
        if (type1 instanceof GenericsType && type2 instanceof GenericsType) return type1.typeVarName === type2.typeVarName;
        if (type1 instanceof EnumType && type2 instanceof EnumType) return type1.decl === type2.decl;
        if (type1 instanceof LambdaType && type2 instanceof LambdaType)
            return this.equals(type1.returnType, type2.returnType) &&
                type1.parameters.length === type2.parameters.length &&
                type1.parameters.every((t, i) => this.equals(t.type, type2.parameters[i].type));
        if (type1 instanceof ClassType && type2 instanceof ClassType)
            return type1.decl === type2.decl && 
                type1.typeArguments.length === type2.typeArguments.length &&
                type1.typeArguments.every((t, i) => this.equals(t, type2.typeArguments[i]));
        if (type1 instanceof InterfaceType && type2 instanceof InterfaceType)
            return type1.decl === type2.decl && 
                type1.typeArguments.length === type2.typeArguments.length &&
                type1.typeArguments.every((t, i) => this.equals(t, type2.typeArguments[i]));
        return false;
    }

    static isAssignableTo(toBeAssigned: IType, whereTo: IType): boolean {
        // AnyType can assigned to any type except to void
        if (toBeAssigned instanceof AnyType && !(whereTo instanceof VoidType)) return true;
        // any type can assigned to AnyType except void
        if (whereTo instanceof AnyType && !(toBeAssigned instanceof VoidType)) return true;
        // any type can assigned to GenericsType except void
        if (whereTo instanceof GenericsType && !(toBeAssigned instanceof VoidType)) return true;
        // null can be assigned anywhere
        // TODO: filter out number and boolean types...
        if (toBeAssigned instanceof NullType && !(whereTo instanceof VoidType)) return true;

        if (this.equals(toBeAssigned, whereTo)) return true;

        if (toBeAssigned instanceof ClassType && whereTo instanceof ClassType)
            return (toBeAssigned.decl.baseClass !== null && this.isAssignableTo(toBeAssigned.decl.baseClass, whereTo)) ||
                toBeAssigned.decl === whereTo.decl && toBeAssigned.typeArguments.every((x, i) => this.isAssignableTo(x, whereTo.typeArguments[i]));
        if (toBeAssigned instanceof ClassType && whereTo instanceof InterfaceType)
            return (toBeAssigned.decl.baseClass !== null && this.isAssignableTo(toBeAssigned.decl.baseClass, whereTo)) || 
                toBeAssigned.decl.baseInterfaces.some(x => this.isAssignableTo(x, whereTo));
        if (toBeAssigned instanceof InterfaceType && whereTo instanceof InterfaceType)
            return toBeAssigned.decl.baseInterfaces.some(x => this.isAssignableTo(x, whereTo)) ||
            toBeAssigned.decl === whereTo.decl && toBeAssigned.typeArguments.every((x, i) => this.isAssignableTo(x, whereTo.typeArguments[i]));
        if (toBeAssigned instanceof LambdaType && whereTo instanceof LambdaType)
            return toBeAssigned.parameters.length === whereTo.parameters.length &&
                toBeAssigned.parameters.every((p, i) => this.isAssignableTo(p.type, whereTo.parameters[i].type)) &&
                (this.isAssignableTo(toBeAssigned.returnType, whereTo.returnType) || whereTo.returnType instanceof GenericsType);

        return false;
    }    
}

export interface IPrimitiveType extends IType { }

export class VoidType implements IPrimitiveType {
    static instance = new VoidType();
    repr() { return "Void"; }
    clone() { return VoidType.instance; }
}

export class AnyType implements IPrimitiveType {
    static instance = new AnyType();
    repr() { return "Any"; }
    clone() { return AnyType.instance; }
}

export class NullType implements IPrimitiveType {
    static instance = new NullType();
    repr() { return "Null"; }
    clone() { return NullType.instance; }
}

export class GenericsType implements IType {
    constructor(public typeVarName: string) { }
    repr() { return `G:${this.typeVarName}`; }

    // @auto-generated
    clone() { return new GenericsType(this.typeVarName); }
}

export class EnumType implements IType {
    constructor(public decl: Enum) { }
    repr() { return `E:${this.decl.name}`; }

    // @auto-generated
    clone() { return new EnumType(this.decl.clone()); }
}

export interface IHasTypeArguments {
    typeArguments: IType[];
}

export interface IInterfaceType extends IType {
    typeArguments: IType[];
    getDecl(): IInterface;
}

export class InterfaceType implements IType, IHasTypeArguments, IInterfaceType {
    constructor(public decl: Interface, public typeArguments: IType[]) { }
    getDecl(): IInterface { return this.decl; }
    repr() { return `I:${this.decl.name}${TypeHelper.argsRepr(this.typeArguments)}`; }

    // @auto-generated
    clone() { return new InterfaceType(this.decl.clone(), this.typeArguments.map(x => x.clone())); }
}

export class ClassType implements IType, IHasTypeArguments, IInterfaceType {
    constructor(public decl: Class, public typeArguments: IType[]) { }
    getDecl(): IInterface { return this.decl; }
    repr() { return `C:${this.decl.name}${TypeHelper.argsRepr(this.typeArguments)}`; }

    // @auto-generated
    clone() { return new ClassType(this.decl.clone(), this.typeArguments.map(x => x.clone())); }
}

export class UnresolvedType implements IType, IHasTypeArguments {
    constructor(public typeName: string, public typeArguments: IType[]) { }
    repr() { return `X:${this.typeName}${TypeHelper.argsRepr(this.typeArguments)}`; }

    // @auto-generated
    clone() { return new UnresolvedType(this.typeName, this.typeArguments.map(x => x.clone())); }
}

export class LambdaType implements IType {
    constructor(public parameters: MethodParameter[], public returnType: IType) { }
    repr() { return `L:(${this.parameters.map(x => x.type.repr()).join(", ")})=>${this.returnType.repr()}`; }

    // @auto-generated
    clone() { return new LambdaType(this.parameters.map(x => x.clone()), this.returnType.clone()); }
}
