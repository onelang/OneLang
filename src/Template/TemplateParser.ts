import { Reader } from "../Parsers/Common/Reader";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { ExpressionNode, ForNode, ITemplateNode, LiteralNode, TemplateBlock } from "./Nodes";

export class TemplateParser {
    reader: Reader;
    exprParser: ExpressionParser;

    constructor(public template: string) {
        this.reader = new Reader(template);
        this.exprParser = new ExpressionParser(this.reader);
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

    parseBlock(): TemplateBlock {
        const items: ITemplateNode[] = [];
        while (!this.reader.eof) {
            if (this.reader.peekToken("{{/")) break;
            if (this.reader.readToken("{{")) {
                if (this.reader.readToken("for")) {
                    const varName = this.reader.readIdentifier();
                    this.reader.expectToken("of");
                    const itemsExpr = this.exprParser.parse();
                    const attrs = this.parseAttributes();
                    this.reader.expectToken("}}");
                    const body = this.parseBlock();
                    this.reader.expectToken("{{/for}}");
                    items.push(new ForNode(varName, itemsExpr, body, attrs["joiner"]||null));
                } else {
                    const expr = this.exprParser.parse();
                    items.push(new ExpressionNode(expr));
                    this.reader.expectToken("}}");
                }
            } else {
                let literal = this.reader.readUntil("{{", true);
                if (literal.endsWith("\\") && !literal.endsWith("\\\\"))
                    literal = literal.substring(0, literal.length - 1) + "{{";
                if (literal !== "")
                    items.push(new LiteralNode(literal));
            }
        }
        return new TemplateBlock(items);
    }

    parse(): TemplateBlock {
        return this.parseBlock();
    }
}
