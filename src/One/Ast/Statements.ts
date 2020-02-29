import { Block, IVariableWithInitializer, IVariable, IHasAttributesAndTrivia } from "./Types";
import { Expression } from "./Expressions";
import { Type } from "./AstTypes";

export class Statement implements IHasAttributesAndTrivia {
    leadingTrivia: string;
    /** @creator FillAttributesFromTrivia */
    attributes: { [name: string]: string };
    parentBlock: Block;
}

export class IfStatement extends Statement {
    public else: Block;

    constructor(
        public condition: Expression, 
        public then: Block,
        else_: Block) {
            super();
            this.else = else_; // "else" is a reserved word in parameter list
        }
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

export class UnsetStatement extends Statement {
    constructor(public expression: Expression) { super(); }
}

export class VariableDeclaration extends Statement implements IVariableWithInitializer {
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { super(); }
    isMutable: boolean;
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

export class ForeachVariable implements IVariable {
    constructor(public name: string) { }
    type: Type;
}

export class ForeachStatement extends Statement {
    constructor(
        public itemVar: ForeachVariable,
        public items: Expression,
        public body: Block) { super(); }
}

export class ForVariable implements IVariableWithInitializer {
    constructor(
        public name: string,
        public type: Type,
        public initializer: Expression) { }
}

export class ForStatement extends Statement {
    constructor(
        public itemVar: ForVariable,
        public condition: Expression, 
        public incrementor: Expression, 
        public body: Block) { super(); }
}