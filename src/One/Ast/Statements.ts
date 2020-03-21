import { Block, IVariableWithInitializer, IVariable, IHasAttributesAndTrivia } from "./Types";
import { Expression } from "./Expressions";
import { Type } from "./AstTypes";
import { ForVariableReference, ForeachVariableReference, VariableDeclarationReference, IReferencable, Reference, CatchVariableReference } from "./References";

export class Statement implements IHasAttributesAndTrivia {
    leadingTrivia: string;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
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
    isMutable: boolean;

    /** @creator ResolveIdentifiers */
    references: VariableDeclarationReference[] = [];
    createReference(): Reference { return new VariableDeclarationReference(this); }
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