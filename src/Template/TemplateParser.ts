import { Reader } from "../Parsers/Common/Reader";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { ExpressionNode, ForNode, ITemplateNode, LiteralNode, TemplateBlock } from "./Nodes";
import { Identifier } from "../One/Ast/Expressions";
import { TypeScriptParser2 } from "../Parsers/TypeScriptParser";

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

    parseBlock(): TemplateBlock {
        const items: ITemplateNode[] = [];
        while (!this.reader.eof) {
            if (this.reader.peekExactly("{{/")) break;
            if (this.reader.readExactly("${")) {
                const expr = this.parser.parseExpression();
                items.push(new ExpressionNode(expr));
                this.reader.expectToken("}");
            } else if (this.reader.readExactly("$")) {
                const id = this.reader.expectIdentifier();
                items.push(new ExpressionNode(new Identifier(id)));
            } else if (this.reader.readExactly("{{")) {
                if (this.reader.readToken("for")) {
                    const varName = this.reader.expectIdentifier();
                    this.reader.expectToken("of");
                    const itemsExpr = this.parser.parseExpression();
                    const attrs = this.parseAttributes();
                    this.reader.expectToken("}}");
                    const body = this.parseBlock();
                    this.reader.expectToken("{{/for}}");
                    items.push(new ForNode(varName, itemsExpr, body, attrs["joiner"]||null));
                } else {
                    const expr = this.parser.parseExpression();
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
