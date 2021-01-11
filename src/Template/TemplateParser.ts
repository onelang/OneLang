import { Reader } from "../Parsers/Common/Reader";
import { ExpressionNode, ForNode, ITemplateNode, LiteralNode, TemplateBlock } from "./Nodes";
import { Identifier } from "../One/Ast/Expressions";
import { TypeScriptParser2 } from "../Parsers/TypeScriptParser";

class BlockIndentManager {
    deindentLen = -1;

    constructor(public block: TemplateBlock, public indentLen: number) { }

    removePrevIndent(): number {
        if (this.block.items.length === 0) return 0;
        const lastItem = this.block.items[this.block.items.length - 1];

        if (!(lastItem instanceof LiteralNode)) return 0;
        const lit = <LiteralNode>lastItem;

        for (let pos = lit.value.length - 1; pos >= 0; pos--) {
            if (lit.value[pos] === '\n') {
                const indent = lit.value.length - pos - 1;
                lit.value = lit.value.substring(0, pos);
                if (indent < 0) debugger;
                return indent;
            }

            if (lit.value[pos] !== ' ')
                break;
        }

        return 0;
    }

    deindent(lit: LiteralNode): LiteralNode {
        if (this.indentLen === 0) return lit; // do not deindent root nodes
        
        const lines = lit.value.split(/\r?\n/);
        if (lines.length === 1) return lit;

        const newLines: string[] = [lines[0]];
        for (let iLine = 1; iLine < lines.length; iLine++) {
            const line = lines[iLine];

            if (this.deindentLen === -1)
                for (let i = 0; i < line.length; i++)
                    if (line[i] !== ' ') {
                        this.deindentLen = i;
                        if (this.deindentLen - this.indentLen < 0) debugger;
                        break;
                    }

            if (this.deindentLen === -1)
                newLines.push(line);
            else {
                const spaceLen = line.length < this.deindentLen ? line.length : this.deindentLen;
                for (let i = 0; i < spaceLen; i++)
                    if (line[i] !== ' ')
                        throw new Error("invalid indent");
                newLines.push(line.substr(this.deindentLen - this.indentLen));
            }
        }
        lit.value = newLines.join("\n");
        return lit;
    }
}

export class TemplateParser {
    reader: Reader;
    parser: TypeScriptParser2;

    constructor(public template: string) {
        this.parser = new TypeScriptParser2(template);
        this.parser.allowDollarIds = true;
        this.reader = this.parser.reader;
    }

    parseAttributes() {
        const result: { [name: string]: string } = {};
        while (this.reader.readToken(",")) {
            const key = this.reader.expectIdentifier();
            const value = this.reader.readToken("=") ? this.reader.expectString() : null;
            result[key] = value;
        }
        return result;
    }

    parseBlock(indentLen = 0): TemplateBlock {
        const block = new TemplateBlock([]);
        const indentMan = new BlockIndentManager(block, indentLen);
        while (!this.reader.eof) {
            if (this.reader.peekExactly("{{/")) break;
            if (this.reader.readExactly("${")) {
                const expr = this.parser.parseExpression();
                block.items.push(new ExpressionNode(expr));
                this.reader.expectToken("}");
            } else if (this.reader.readExactly("$")) {
                const id = this.reader.expectIdentifier();
                block.items.push(new ExpressionNode(new Identifier(id)));
            } else if (this.reader.readExactly("{{")) {
                const blockIndentLen = indentMan.removePrevIndent();

                if (this.reader.readToken("for")) {
                    const varName = this.reader.expectIdentifier();
                    this.reader.expectToken("of");
                    const itemsExpr = this.parser.parseExpression();
                    const attrs = this.parseAttributes();
                    this.reader.expectToken("}}");
                    const body = this.parseBlock(blockIndentLen);
                    this.reader.expectToken("{{/for}}");
                    block.items.push(new ForNode(varName, itemsExpr, body, attrs["joiner"]||null));
                } else {
                    const expr = this.parser.parseExpression();
                    block.items.push(new ExpressionNode(expr));
                    this.reader.expectToken("}}");
                }
            } else {
                let literal = this.reader.readRegex("([^\\\\]\\\\(\\{\\{|\\$)|\r|\n|(?!\\{\\{|\\$\\{|\\$).)*")[0];
                if (literal === "") throw new Error("This should not happen!");
                block.items.push(indentMan.deindent(new LiteralNode(literal)));
            }
        }

        if (indentLen !== 0)
            indentMan.removePrevIndent();

        return block;
    }

    parse(): TemplateBlock {
        return this.parseBlock();
    }
}
