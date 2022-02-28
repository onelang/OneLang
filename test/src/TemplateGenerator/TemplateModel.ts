import { Expression } from "@one/One/Ast/Expressions";
import { Node } from "./BlockParser";

export class TemplateNode {
    public node: Node;
    public params: { [name: string]: string } = {};
}

export class GeneratorTemplateFile extends TemplateNode {
    constructor(public typeTemplates: TypeTemplate[]) { super(); }
}

export class TemplateNodeWithBody extends TemplateNode {
    constructor(public body: TemplateBlock) { super(); }
}

export class TypeTemplate extends TemplateNodeWithBody {
    constructor(
        public typeName: string,
        public varAlias: string,
        public body: TemplateBlock) { super(body); }
}

export class Case extends TemplateNodeWithBody {
    constructor(public matchExpr: Expression, public body: TemplateBlock) { super(body); }
}

export class ElseNode extends TemplateNodeWithBody {
    constructor(public body: TemplateBlock) { super(body); }
}

export class IfNode extends TemplateNodeWithBody {
    public elifs: IfNode[] = [];
    public else_: TemplateBlock = null;

    constructor(
        public condition: Expression,
        public then_: TemplateBlock) { super(then_); }
}

export class ElIfNode extends TemplateNodeWithBody {
    constructor(
        public condition: Expression,
        public then_: TemplateBlock) { super(then_); }
}

export class UsingNode extends TemplateNode {
    constructor(public using: string) { super(); }
}

export class TemplateBlock extends TemplateNode {
    constructor(public children: TemplateNode[]) { super(); }
}

export class SwitchNode extends TemplateNode {
    constructor(
        public switchExpr: Expression,
        public cases: Case[],
        public else_: ElseNode) { super(); }
}

export class ForNode extends TemplateNodeWithBody {
    constructor(
        public itemsExpr: Expression, 
        public body: TemplateBlock) {
            super(body);
    }
}

export class BlockNode extends TemplateNodeWithBody {
    constructor(public body: TemplateBlock) {
        super(body);
    }
}

export class ParamsNode extends TemplateNodeWithBody {
    constructor(public body: TemplateBlock) {
        super(body);
    }
}

export class Empty extends TemplateNode { }