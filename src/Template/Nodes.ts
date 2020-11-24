import { ExpressionValue } from "../Generator/TemplateFileGeneratorPlugin";
import { Expression, StringLiteral } from "../One/Ast/Expressions";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";
import { ExprVM } from "../VM/ExprVM";
import { ArrayValue, IVMValue, ObjectValue, StringValue } from "../VM/Values";

export interface ITemplateNode {
    format(context: TemplateContext): string;
}

export interface ITemplateFormatHooks {
    formatValue(value: IVMValue): string;
}

export class TemplateContext {
    constructor(public model: ObjectValue, public hooks: ITemplateFormatHooks = null) { }
}

export class TemplateBlock implements ITemplateNode {
    constructor(public items: ITemplateNode[]) { }

    format(context: TemplateContext): string { 
        return this.items.map(x => x.format(context)).join("");
    }
}

export class LiteralNode implements ITemplateNode {
    constructor(public value: string) { }

    format(context: TemplateContext): string { return this.value; }
}

export class ExpressionNode implements ITemplateNode {
    constructor(public expr: Expression) { }

    format(context: TemplateContext): string {
        const value = new ExprVM(context.model).evaluate(this.expr);
        if (value instanceof StringValue) return value.value;

        if (context.hooks !== null) {
            const result = context.hooks.formatValue(value);
            if (result !== null)
                return result;
        }

        throw new Error(`ExpressionNode (${TSOverviewGenerator.preview.expr(this.expr)}) return a non-string result!`);
    }
}

export class ForNode implements ITemplateNode {
    constructor(public variableName: string, public itemsExpr: Expression, public body: TemplateBlock, public joiner: string) { }

    format(context: TemplateContext): string {
        const items = new ExprVM(context.model).evaluate(this.itemsExpr);
        if (!(items instanceof ArrayValue))
            throw new Error(`ForNode items (${TSOverviewGenerator.preview.expr(this.itemsExpr)}) return a non-array result!`);
        
        let result = "";
        for (const item of (<ArrayValue>items).items) {
            if (this.joiner !== null && result !== "")
                result += this.joiner;

            context.model.props[this.variableName] = item;
            result += this.body.format(context);
        }
        delete context.model.props[this.variableName];
        return result;
    }
}
