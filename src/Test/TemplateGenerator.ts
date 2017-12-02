import { ExprLangAst as ExprAst } from "./ExprLangAst";
import { ExprLangVM } from "./ExprLangVM";
import { TemplateAst as TmplAst } from "./TemplateAst";

/**
 * Some important notes:
 *  - nodes DON'T include trailing '\n', it's only added when they are included into somewhere else
 *  - the AST usually contains all the newline ('\n') characters, except for "for" and "if" constructs,
 *    because those are not always generate _any_ result (not even a newline), eg:
 *      - for: no items and {{else}} is not specified
 *      - if: condition is not true and {{else}} is not specified
 *    so we have to add that '\n' here in the generator based on runtime data 
 *    (but only if it's not an inline construct & it's not the last node -> no trailing '\n' is allowed)
 *  - empty string ("") and <null> are different: <null> is created when an if or for does not match any item
 *    <null> does not generate code, not counts as a valid item in for (so no separator included)
 *    empty string ("") can generate code (eg. new line, separator in for loop, etc)
 */
export class TemplateGenerator {
    constructor(public template: TmplAst.Node, public model: any) { }

    evaluate(expr: ExprAst.Expression, model: any) {
        return ExprLangVM.evaluate(expr, model);
    }

    generateNode(node: TmplAst.Node, model: any) {
        let result: string;

        if (node instanceof TmplAst.TextNode) {
            result = node.value;
        } else if (node instanceof TmplAst.TemplateNode) {
            result = this.evaluate(node.expr, model);
        } else if (node instanceof TmplAst.Block) {
            const lines = [];
            for (let itemIdx = 0; itemIdx < node.items.length; itemIdx++) {
                const item = node.items[itemIdx];
                const isLastNode = itemIdx === node.items.length - 1;
                const line = this.generateNode(item, model);
                if (line !== null) {
                    lines.push(line);
                    if (!isLastNode && (item instanceof TmplAst.ForNode || item instanceof TmplAst.IfNode) && !item.inline)
                        lines.push("\n");
                }
            }
            result = lines.length === 0 ? null : lines.join("");
        } else if (node instanceof TmplAst.IfNode) {
            let resultBlock = node.else;

            for (const item of node.items)
            {
                const condValue = this.evaluate(item.condition, model);
                if (condValue) {
                    resultBlock = item.body;
                    break;
                }
            }

            result = resultBlock ? this.generateNode(resultBlock, model) : null;
        } else if (node instanceof TmplAst.ForNode) {
            const array = <any[]> this.evaluate(node.arrayExpr, model);
            if (array.length === 0) {
                result = node.else ? this.generateNode(node.else, model) : null;
            } else {
                const model = Object.assign({}, this.model);
                
                const lines = [];
                for (const item of array) {
                    model[node.itemName] = item;
                    const line = this.generateNode(node.body, model);
                    if (line !== null)
                        lines.push(line);
                }

                result = lines.length === 0 ? null : lines.join(node.separator);
            }
        } else {
            throw new Error("Unexpected node type");
        }

        return result;
    }

    generate() {
        const result = this.generateNode(this.template, this.model);
        return result;
    }
}
