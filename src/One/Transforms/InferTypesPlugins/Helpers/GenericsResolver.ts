import { Expression } from "../../../Ast/Expressions";
import { ClassType, Type, GenericsType, InterfaceType, LambdaType, EnumType, AnyType } from "../../../Ast/AstTypes";
import { MethodParameter } from "../../../Ast/Types";

export class GenericsResolver {
    resolutionMap = new Map<string, Type>();

    static fromObject(object: Expression) {
        const resolver = new GenericsResolver();
        resolver.collectClassGenericsFromObject(object);
        return resolver;
    }

    public collectClassGenericsFromObject(actualObject: Expression) {
        const actualType = actualObject.getType();
        if (actualType instanceof ClassType) {
            if (!this.collectResolutionsFromActualType(actualType.decl.type, actualType))
                debugger; // this should not happen
        } else
            throw new Error(`Expected ClassType, got ${actualType !== null ? actualType.repr() : "<null>"}`);
    }

    public collectResolutionsFromActualType(genericType: Type, actualType: Type): boolean {
        if (genericType instanceof GenericsType) {
            const prevRes = this.resolutionMap.get(genericType.typeVarName) || null;
            if (prevRes !== null && !Type.equals(prevRes, actualType))
                throw new Error(`Resolving ${genericType.repr()} is ambiguous, ${prevRes.repr()} <> ${actualType.repr()}`);
            this.resolutionMap.set(genericType.typeVarName, actualType);
            return true;
        } else if (genericType instanceof ClassType && actualType instanceof ClassType && genericType.decl === actualType.decl) {
            if (genericType.typeArguments.length !== actualType.typeArguments.length)
                throw new Error(`Same class used with different number of type arguments (${genericType.typeArguments.length} <> ${actualType.typeArguments.length})`);
            return genericType.typeArguments.every((x, i) => this.collectResolutionsFromActualType(x, actualType.typeArguments[i]));
        } else if (genericType instanceof InterfaceType && actualType instanceof InterfaceType && genericType.decl === actualType.decl) {
            if (genericType.typeArguments.length !== actualType.typeArguments.length)
                throw new Error(`Same class used with different number of type arguments (${genericType.typeArguments.length} <> ${actualType.typeArguments.length})`);
            return genericType.typeArguments.every((x, i) => this.collectResolutionsFromActualType(x, actualType.typeArguments[i]));
        } else if (genericType instanceof LambdaType && actualType instanceof LambdaType) {
            if (genericType.parameters.length !== actualType.parameters.length)
                throw new Error(`Generic lambda type has ${genericType.parameters.length} parameters while the actual type has ${actualType.parameters.length}`);
            const paramsOk = genericType.parameters.every((x, i) => this.collectResolutionsFromActualType(x.type, actualType.parameters[i].type));
            const resultOk = this.collectResolutionsFromActualType(genericType.returnType, actualType.returnType);
            return paramsOk && resultOk;
        } else if (genericType instanceof EnumType && actualType instanceof EnumType && genericType.decl === actualType.decl) {
        } else if (genericType instanceof AnyType || actualType instanceof AnyType) {
        } else {
            throw new Error(`Generic type ${genericType.repr()} is not compatible with actual type ${actualType.repr()}`);
        }
        return false;
    }

    public resolveType(type: Type, mustResolveAllGenerics: boolean): Type {
        if (type instanceof GenericsType) {
            const resolvedType = this.resolutionMap.get(type.typeVarName) || null;
            if (resolvedType === null && mustResolveAllGenerics)
                throw new Error(`Could not resolve generics type: ${type.repr()}`);
            return resolvedType !== null ? resolvedType : type;
        } else if (type instanceof ClassType) {
            return new ClassType(type.decl, type.typeArguments.map(x => this.resolveType(x, mustResolveAllGenerics)));
        } else if (type instanceof InterfaceType) {
            return new InterfaceType(type.decl, type.typeArguments.map(x => this.resolveType(x, mustResolveAllGenerics)));
        } else if (type instanceof LambdaType) {
            return new LambdaType(type.parameters.map(x => new MethodParameter(x.name, this.resolveType(x.type, mustResolveAllGenerics), x.initializer)), this.resolveType(type.returnType, mustResolveAllGenerics));
        } else
            return type;
    }
}
