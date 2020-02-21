import * as Ast from "./TemplateAst";
import { ExprLangAstPrinter } from "../ExprLang/ExprLangAstPrinter";

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

    processNode(node: Ast.Node) {
        this.indent++;
        if (node instanceof Ast.Block) {
            for (let iLine = 0; iLine < node.lines.length; iLine++) {
                const line = node.lines[iLine];
                const indentText = line instanceof Ast.Line ? ` [indent=${line.indentLen}]` : "";
                this.addLine(`Line #${iLine + 1}${indentText}:`);
                this.processNode(line);
            }
        } else if (node instanceof Ast.Line) {
            for (let iItem = 0; iItem < node.items.length; iItem++) {
                const item = node.items[iItem];
                
                let inlineValue = null;
                if (item instanceof Ast.TextNode) {
                    inlineValue = `"${item.value.replace(/\n/g, "\\n")}"`;
                } else if (item instanceof Ast.TemplateNode) {
                    const exprText = ExprLangAstPrinter.print(item.expr);
                    inlineValue = `"${exprText}"`;
                }

                this.addLine(`Item #${iItem + 1}: ${inlineValue||""}`);
                if (!inlineValue)
                    this.processNode(item);
            }
        } else if (node instanceof Ast.ForNode) {
            const arrayExprText = ExprLangAstPrinter.print(node.arrayExpr);
            this.addLine(`For ${node.itemName} in ${arrayExprText}:${node.inline ? " [inline]" : ""}`);
            this.processNode(node.body);
            if (node.else) {
                this.addLine(`Else:`);
                this.processNode(node.else);
            }
        } else if (node instanceof Ast.IfNode) {
            let first = true;
            for (const item of node.items) {
                const condText = ExprLangAstPrinter.print(item.condition);
                this.addLine(`${first ? "If" : "Elif"} (${condText}):${node.inline ? " [inline]" : ""}`);
                this.processNode(item.body);
                first = false;
            }

            if (node.else) {
                this.addLine(`else:`);
                this.processNode(node.else);
            }
        } else {
            throw new Error("Unknown node");
        }
        this.indent--;
    }

    print(node: Ast.Node) {
        this.processNode(node);
        return this.result;
    }
}
