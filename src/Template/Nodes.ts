import { Expression } from "../One/Ast/Expressions";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";
import { ExprVM } from "../VM/ExprVM";
import { ArrayValue, ObjectValue, StringValue } from "../VM/Values";

export interface ITemplateNode {
    format(model: ObjectValue): string;
}

export class TemplateBlock implements ITemplateNode {
    constructor(public items: ITemplateNode[]) { }

    format(model: ObjectValue): string { 
        return this.items.map(x => x.format(model)).join("");
    }
}

export class LiteralNode implements ITemplateNode {
    constructor(public value: string) { }

    format(model: ObjectValue): string { return this.value; }
}

export class ExpressionNode implements ITemplateNode {
    constructor(public expr: Expression) { }

    format(model: ObjectValue): string {
        const result = new ExprVM(model).evaluate(this.expr);
        if (result instanceof StringValue)
            return result.value;
        else
            throw new Error(`ExpressionNode (${TSOverviewGenerator.preview.expr(this.expr)}) return a non-string result!`);
    }
}

export class ForNode implements ITemplateNode {
    constructor(public variableName: string, public itemsExpr: Expression, public body: TemplateBlock, public joiner: string) { }

    format(model: ObjectValue): string {
        const items = new ExprVM(model).evaluate(this.itemsExpr);
        if (!(items instanceof ArrayValue))
            throw new Error(`ForNode items (${TSOverviewGenerator.preview.expr(this.itemsExpr)}) return a non-array result!`);
        
        let result = "";
        for (const item of (<ArrayValue>items).items) {
            if (this.joiner !== null && result !== "")
                result += this.joiner;

            model.props[this.variableName] = item;
            result += this.body.format(model);
        }
        delete model.props[this.variableName];
        return result;
    }
}
