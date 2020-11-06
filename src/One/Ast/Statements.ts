import { IVariableWithInitializer, IVariable, IHasAttributesAndTrivia, IAstNode, MutabilityInfo } from "./Types";
import { Expression } from "./Expressions";
import { ForVariableReference, ForeachVariableReference, VariableDeclarationReference, IReferencable, Reference, CatchVariableReference } from "./References";
import { IType } from "./Interfaces";

export abstract class Statement implements IHasAttributesAndTrivia, IAstNode {
    leadingTrivia: string = null;

    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string } = null;

    // php-fix
    constructor() { }

    abstract clone(): Statement;

    cloneTo(copy: Statement) { 
        copy.leadingTrivia = this.leadingTrivia;
        
        copy.attributes = {};
        for (const key of Object.keys(this.attributes))
            copy.attributes[key] = this.attributes[key];
    }
}

export class IfStatement extends Statement {
    constructor(
        public condition: Expression, 
        public then: Block,
        public else_: Block) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new IfStatement(this.condition.clone(), this.then.clone(), this.else_.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ReturnStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ReturnStatement(this.expression.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ThrowStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ThrowStatement(this.expression.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ExpressionStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ExpressionStatement(this.expression.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class BreakStatement extends Statement {
    clone() { return new BreakStatement(); }
}

export class ContinueStatement extends Statement {
    clone() { return new ContinueStatement(); }
}

export class UnsetStatement extends Statement {
    constructor(public expression: Expression) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new UnsetStatement(this.expression.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
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

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new VariableDeclaration(this.name, this.type.clone(), this.initializer.clone());
        result.references = this.references.map(x => x.clone());
        result.mutability = this.mutability.clone();
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class WhileStatement extends Statement {
    constructor(
        public condition: Expression,
        public body: Block) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new WhileStatement(this.condition.clone(), this.body.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class DoStatement extends Statement {
    constructor(
        public condition: Expression,
        public body: Block) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new DoStatement(this.condition.clone(), this.body.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class ForeachVariable implements IVariable, IReferencable {
    constructor(public name: string) { }
    type: IType = null;

    /** @creator ResolveIdentifiers */
    references: ForeachVariableReference[] = [];
    createReference(): Reference { return new ForeachVariableReference(this); }

    /** @creator FillMutability */
    mutability: MutabilityInfo = null;

    // #region @auto-generated generate-ast-helper-code
    clone() { return new ForeachVariable(this.name); }
    // #endregion
}

export class ForeachStatement extends Statement {
    constructor(
        public itemVar: ForeachVariable,
        public items: Expression,
        public body: Block) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ForeachStatement(this.itemVar.clone(), this.items.clone(), this.body.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
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

    // #region @auto-generated generate-ast-helper-code
    clone() { return new ForVariable(this.name, this.type.clone(), this.initializer.clone()); }
    // #endregion
}

export class ForStatement extends Statement {
    constructor(
        public itemVar: ForVariable,
        public condition: Expression, 
        public incrementor: Expression, 
        public body: Block) { super(); }

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new ForStatement(this.itemVar.clone(), this.condition.clone(), this.incrementor.clone(), this.body.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
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

    // #region @auto-generated generate-ast-helper-code
    clone() { return new CatchVariable(this.name, this.type.clone()); }
    // #endregion
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

    // #region @auto-generated generate-ast-helper-code
    clone() {
        const result = new TryStatement(this.tryBody.clone(), this.catchVar.clone(), this.catchBody.clone(), this.finallyBody.clone());
        this.cloneTo(result);
        return result;
    }
    // #endregion
}

export class Block {
    /** @creator TypeScriptParser2 */
    constructor(public statements: Statement[]) { }

    // #region @auto-generated generate-ast-helper-code
    clone() { return new Block(this.statements.map(x => x.clone())); }
    // #endregion
}
