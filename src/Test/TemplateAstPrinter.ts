import { TemplateAst as TmplAst } from "./TemplateAst";
import { ExprAstPrinter } from "./AstPrinter";

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

    processNode(node: TmplAst.Node) {
        this.indent++;
        if (node instanceof TmplAst.Block) {
            for (let iLine = 0; iLine < node.lines.length; iLine++) {
                const line = node.lines[iLine];
                const indentText = line instanceof TmplAst.Line ? ` [indent=${line.indentLen}]` : "";
                this.addLine(`Line #${iLine + 1}${indentText}:`);
                this.processNode(line);
            }
        } else if (node instanceof TmplAst.Line) {
            for (let iItem = 0; iItem < node.items.length; iItem++) {
                const item = node.items[iItem];
                
                let inlineValue = null;
                if (item instanceof TmplAst.TextNode) {
                    inlineValue = `"${item.value.replace(/\n/g, "\\n")}"`;
                } else if (item instanceof TmplAst.TemplateNode) {
                    const exprText = ExprAstPrinter.print(item.expr);
                    inlineValue = `"${exprText}"`;
                }

                this.addLine(`Item #${iItem + 1}: ${inlineValue||""}`);
                if (!inlineValue)
                    this.processNode(item);
            }
        } else if (node instanceof TmplAst.ForNode) {
            const arrayExprText = ExprAstPrinter.print(node.arrayExpr);
            this.addLine(`For ${node.itemName} in ${arrayExprText}:${node.inline ? " [inline]" : ""}`);
            this.processNode(node.body);
            if (node.else) {
                this.addLine(`Else:`);
                this.processNode(node.else);
            }
        } else if (node instanceof TmplAst.IfNode) {
            let first = true;
            for (const item of node.items) {
                const condText = ExprAstPrinter.print(item.condition);
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

    print(node: TmplAst.Node) {
        this.processNode(node);
        return this.result;
    }
}
