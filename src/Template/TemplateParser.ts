import { Reader } from "../Parsers/Common/Reader";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { ExpressionNode, ForNode, ITemplateNode, LiteralNode, TemplateBlock } from "./Nodes";
import { Identifier } from "../One/Ast/Expressions";

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
            if (this.reader.readToken("${")) {
                const expr = this.exprParser.parse();
                items.push(new ExpressionNode(expr));
                this.reader.expectToken("}");
            } else if (this.reader.readToken("$")) {
                const id = this.reader.readIdentifier();
                items.push(new ExpressionNode(new Identifier(id)));
            } else if (this.reader.readToken("{{")) {
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
                let literal = this.reader.readRegex("([^\\\\]\\\\(\\{\\{|\\$)|\r|\n|(?!\\{\\{|\\$\\{|\\$).)*")[0];
                if (literal === "") throw new Error("This should not happen!");
                items.push(new LiteralNode(literal));
            }
        }
        return new TemplateBlock(items);
    }

    parse(): TemplateBlock {
        return this.parseBlock();
    }
}
