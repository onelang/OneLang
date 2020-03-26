import { ExprLangAstPrinter } from "../ExprLang/ExprLangAstPrinter";
import { Node, Block, Line, TextNode, TemplateNode, ForNode, IfNode } from "./TemplateAst";

// Node types: Block, Line, ForNode, IfNode, TextNode, TemplateNode
// Block: BlockItem[]
// BlockItem: Line | For | If
// For: Body & Else can be Block (line-mode) or Line (inline-mode)
// If: Item Body & Else can be Block (line-mode) or Line (inline-mode)
export class TemplateAstPrinter {
    result = "";
    indent = -1;

    addLine(line: string) {
        this.result += `${"  ".repeat(this.indent)}${line}\n`;
    }

    processNode(node: Node): void {
        this.indent++;
        if (node instanceof Block) {
            for (let iLine = 0; iLine < node.lines.length; iLine++) {
                const line = node.lines[iLine];
                const indentText = line instanceof Line ? ` [indent=${line.indentLen}]` : "";
                this.addLine(`Line #${iLine + 1}${indentText}:`);
                this.processNode(line);
            }
        } else if (node instanceof Line) {
            for (let iItem = 0; iItem < node.items.length; iItem++) {
                const item = node.items[iItem];
                
                let inlineValue: string = null;
                if (item instanceof TextNode) {
                    inlineValue = `"${item.value.replace(/\n/g, "\\n")}"`;
                } else if (item instanceof TemplateNode) {
                    const exprText = ExprLangAstPrinter.print(item.expr);
                    inlineValue = `"${exprText}"`;
                }

                this.addLine(`Item #${iItem + 1}: ${inlineValue||""}`);
                if (inlineValue === null)
                    this.processNode(item);
            }
        } else if (node instanceof ForNode) {
            const arrayExprText = ExprLangAstPrinter.print(node.arrayExpr);
            this.addLine(`For ${node.itemName} in ${arrayExprText}:${node.inline ? " [inline]" : ""}`);
            this.processNode(node.body);
            if (node.else !== null) {
                this.addLine(`Else:`);
                this.processNode(node.else);
            }
        } else if (node instanceof IfNode) {
            let first = true;
            for (const item of node.items) {
                const condText = ExprLangAstPrinter.print(item.condition);
                this.addLine(`${first ? "If" : "Elif"} (${condText}):${node.inline ? " [inline]" : ""}`);
                this.processNode(item.body);
                first = false;
            }

            if (node.else !== null) {
                this.addLine(`else:`);
                this.processNode(node.else);
            }
        } else {
            throw new Error("Unknown node");
        }
        this.indent--;
    }

    print(node: Node) {
        this.processNode(node);
        return this.result;
    }
}
