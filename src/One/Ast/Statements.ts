import { IVariableWithInitializer, IVariable, IHasAttributesAndTrivia, IAstNode, MutabilityInfo } from "./Types";
import { Expression } from "./Expressions";
import { ForVariableReference, ForeachVariableReference, VariableDeclarationReference, IReferencable, Reference, CatchVariableReference } from "./References";
import { IType } from "./Interfaces";

export abstract class Statement implements IHasAttributesAndTrivia, IAstNode {
    leadingTrivia: string = null;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string } = null;
    parentBlock: Block;

    // php-fix
    constructor() { }

    abstract clone(): Statement;
}

export class IfStatement extends Statement {
    constructor(
        public condition: Expression, 
        public then: Block,
        public else_: Block) { super(); }

    // @auto-generated
    clone() { return new IfStatement(this.condition.clone(), this.then.clone(), this.else_.clone()); }
}

export class ReturnStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // @auto-generated
    clone() { return new ReturnStatement(this.expression.clone()); }
}

export class ThrowStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // @auto-generated
    clone() { return new ThrowStatement(this.expression.clone()); }
}

export class ExpressionStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // @auto-generated
    clone() { return new ExpressionStatement(this.expression.clone()); }
}

export class BreakStatement extends Statement {
    clone() { return new BreakStatement(); }
}

export class ContinueStatement extends Statement {
    clone() { return new ContinueStatement(); }
}

export class UnsetStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // @auto-generated
    clone() { return new UnsetStatement(this.expression.clone()); }
}

export class VariableDeclaration extends Statement implements IVariableWithInitializer, IReferencable {
    constructor(
        public name: string,
        public type: IType,
        public initializer: Expression) { super(); }

    /** @creator ResolveIdentifiers */
    references: VariableDeclarationReference[] = [];
    createReference(): Reference { return new VariableDeclarationReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;

    // @auto-generated
    clone() { return new VariableDeclaration(this.name, this.type.clone(), this.initializer.clone()); }
}

export class WhileStatement extends Statement {
    constructor(
        public condition: Expression,
        public body: Block) { super(); }

    // @auto-generated
    clone() { return new WhileStatement(this.condition.clone(), this.body.clone()); }
}

export class DoStatement extends Statement {
    constructor(
        public condition: Expression,
        public body: Block) { super(); }

    // @auto-generated
    clone() { return new DoStatement(this.condition.clone(), this.body.clone()); }
}

export class ForeachVariable implements IVariable, IReferencable {
    constructor(public name: string) { }
    type: IType = null;

    /** @creator ResolveIdentifiers */
    references: ForeachVariableReference[] = [];
    createReference(): Reference { return new ForeachVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;

    // @auto-generated
    clone() { return new ForeachVariable(this.name); }
}

export class ForeachStatement extends Statement {
    constructor(
        public itemVar: ForeachVariable,
        public items: Expression,
        public body: Block) { super(); }

    // @auto-generated
    clone() { return new ForeachStatement(this.itemVar.clone(), this.items.clone(), this.body.clone()); }
}

export class ForVariable implements IVariableWithInitializer, IReferencable {
    constructor(
        public name: string,
        public type: IType,
        public initializer: Expression) { }

    /** @creator ResolveIdentifiers */
    references: ForVariableReference[] = [];
    createReference(): Reference { return new ForVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;

    // @auto-generated
    clone() { return new ForVariable(this.name, this.type.clone(), this.initializer.clone()); }
}

export class ForStatement extends Statement {
    constructor(
        public itemVar: ForVariable,
        public condition: Expression, 
        public incrementor: Expression, 
        public body: Block) { super(); }

    // @auto-generated
    clone() { return new ForStatement(this.itemVar.clone(), this.condition.clone(), this.incrementor.clone(), this.body.clone()); }
}

export class CatchVariable implements IVariable, IReferencable {
    constructor(
        public name: string,
        public type: IType) { }

    /** @creator ResolveIdentifiers */
    references: CatchVariableReference[] = [];
    createReference(): Reference { return new CatchVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;

    // @auto-generated
    clone() { return new CatchVariable(this.name, this.type.clone()); }
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

    // @auto-generated
    clone() { return new TryStatement(this.tryBody.clone(), this.catchVar.clone(), this.catchBody.clone(), this.finallyBody.clone()); }
}

export class Block {
    /** @creator TypeScriptParser2 */
    constructor(public statements: Statement[]) { }

    // @auto-generated
    clone() { return new Block(this.statements.map(x => x.clone())); }
}
