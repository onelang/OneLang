import { Block, IVariableWithInitializer, IVariable, IHasAttributesAndTrivia, IAstNode, MutabilityInfo } from "./Types";
import { Expression } from "./Expressions";
import { Type } from "./AstTypes";
import { ForVariableReference, ForeachVariableReference, VariableDeclarationReference, IReferencable, Reference, CatchVariableReference } from "./References";

export class Statement implements IHasAttributesAndTrivia, IAstNode {
    leadingTrivia: string = null;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string } = null;
    parentBlock: Block;
}

export class IfStatement extends Statement {
    constructor(
        public condition: Expression, 
        public then: Block,
        public else_: Block) { super(); }
}

export class ReturnStatement extends Statement {
    constructor(public expression: Expression) { super(); }
}

export class ThrowStatement extends Statement {
    constructor(public expression: Expression) { super(); }
}

export class ExpressionStatement extends Statement {
    constructor(public expression: Expression) { super(); }
}

export class BreakStatement extends Statement { }

export class ContinueStatement extends Statement { }

export class UnsetStatement extends Statement {
    constructor(public expression: Expression) { super(); }
}

export class VariableDeclaration extends Statement implements IVariableWithInitializer, IReferencable {
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { super(); }

    /** @creator ResolveIdentifiers */
    references: VariableDeclarationReference[] = [];
    createReference(): Reference { return new VariableDeclarationReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;
}

export class WhileStatement extends Statement {
    constructor(
        public condition: Expression,
        public body: Block) { super(); }
}

export class DoStatement extends Statement {
    constructor(
        public condition: Expression,
        public body: Block) { super(); }
}

export class ForeachVariable implements IVariable, IReferencable {
    constructor(public name: string) { }
    type: Type = null;

    /** @creator ResolveIdentifiers */
    references: ForeachVariableReference[] = [];
    createReference(): Reference { return new ForeachVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;
}

export class ForeachStatement extends Statement {
    constructor(
        public itemVar: ForeachVariable,
        public items: Expression,
        public body: Block) { super(); }
}

export class ForVariable implements IVariableWithInitializer, IReferencable {
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { }

    /** @creator ResolveIdentifiers */
    references: ForVariableReference[] = [];
    createReference(): Reference { return new ForVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;
}

export class ForStatement extends Statement {
    constructor(
        public itemVar: ForVariable,
        public condition: Expression, 
        public incrementor: Expression, 
        public body: Block) { super(); }
}

export class CatchVariable implements IVariable, IReferencable {
    constructor(
        public name: string,
        public type: Type) { }

    /** @creator ResolveIdentifiers */
    references: CatchVariableReference[] = [];
    createReference(): Reference { return new CatchVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;
}

export class TryStatement extends Statement {
    constructor(
        public tryBody: Block,
        public catchVar: CatchVariable,
        public catchBody: Block,
        public finallyBody: Block) {
            super();
            if (this.catchBody === null && this.finallyBody === null)
                throw new Error("try without catch and finally is not allowed");
        }
}