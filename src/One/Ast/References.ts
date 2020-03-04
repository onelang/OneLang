import { Class, Enum, MethodParameter, GlobalFunction, Field, Property, Method, EnumMember } from "./Types";
import { VariableDeclaration, ForVariable, ForeachVariable } from "./Statements";
import { Expression } from "./Expressions";

export interface IReferencable {
    createReference(name: string): Reference;
}

export class Reference extends Expression { }

export class ClassReference extends Reference {
    constructor(public decl: Class) { super(); decl.classReferences.push(this); }
}

export class GlobalFunctionReference extends Reference {
    constructor(public decl: GlobalFunction) { super(); decl.references.push(this); }
}

export class MethodParameterReference extends Reference {
    constructor(public decl: MethodParameter) { super(); decl.references.push(this); }
}

export class EnumReference extends Reference {
    constructor(public decl: Enum) { super(); decl.references.push(this); }
}

export class EnumMemberReference extends Expression {
    constructor(public decl: EnumMember) { super(); decl.references.push(this); }
}

export class ThisReference extends Reference {
    constructor(public cls: Class) { super(); cls.thisReferences.push(this); }
}

export class SuperReference extends Reference {
    constructor(public cls: Class) { super(); cls.superReferences.push(this); }
}

export class VariableDeclarationReference extends Reference {
    constructor(public decl: VariableDeclaration) { super(); decl.references.push(this); }
}

export class ForVariableReference extends Reference {
    constructor(public decl: ForVariable) { super(); decl.references.push(this); }
}

export class ForeachVariableReference extends Reference {
    constructor(public decl: ForeachVariable) { super(); decl.references.push(this); }
}

export class StaticFieldReference extends Reference {
    constructor(public decl: Field) { super(); decl.staticReferences.push(this); }
}

export class StaticPropertyReference extends Reference {
    constructor(public decl: Property) { super(); decl.staticReferences.push(this); }
}

export class StaticMethodReference extends Reference {
    constructor(public decl: Method) { super(); decl.staticReferences.push(this); }
}

export class InstanceFieldReference extends Reference {
    constructor(public object: Expression, public field: Field) { super(); field.instanceReferences.push(this); }
}

export class InstancePropertyReference extends Reference {
    constructor(public object: Expression, public property: Property) { super(); property.instanceReferences.push(this); }
}

export class InstanceMethodReference extends Reference {
    constructor(public object: Expression, public method: Method) { super(); method.instanceReferences.push(this); }
}