import { Class, Enum, MethodParameter } from "./Types";
import { VariableDeclaration, ForVariable, ForeachVariable } from "./Statements";

export interface IReference {
    getName(): string;
}

export class ClassReference implements IReference {
    constructor(public decl: Class) { }
    getName() { return this.decl.name; }
}

export class MethodParameterReference implements IReference {
    constructor(public decl: MethodParameter) { }
    getName() { return this.decl.name; }
}

export class EnumReference implements IReference {
    constructor(public decl: Enum) { }
    getName() { return this.decl.name; }
}

export class ThisReference implements IReference {
    constructor(public cls: Class) { }
    getName() { return "this"; }
}

export class SuperReference implements IReference {
    constructor(public cls: Class) { }
    getName() { return "super"; }
}

export class VariableDeclarationReference implements IReference {
    constructor(public decl: VariableDeclaration) { }
    getName() { return this.decl.name; }
}

export class ForVariableReference implements IReference {
    constructor(public decl: ForVariable) { }
    getName() { return this.decl.name; }
}

export class ForeachVariableReference implements IReference {
    constructor(public decl: ForeachVariable) { }
    getName() { return this.decl.name; }
}

