import { ParamParser } from "./ParamParser";
import { ExpressionParser } from "./ExpressionParser";
import { ExprLangAst as Ast } from "./ExprLangAst";

export type TemplatePartType = "text"|"template"|"for"|"if"|"elif"|"else"|"endif"|"endfor";

export class TemplatePart {
    type: TemplatePartType;
    params: { [name: string]: string|boolean } = {};

    textValue: string;
    for: { itemName: string, array: Ast.Expression };
    if: { condition: Ast.Expression };
    elif: { condition: Ast.Expression };
    template: { expr: Ast.Expression };
    
    isWhitespace = false;

    constructor(public value: string, isText: boolean) {
        let match;
        if (isText) {
            this.type = "text";
            this.textValue = value;
            this.isWhitespace = !!value.match(/^\s*$/);
        } else {
            const paramsOffs = value.lastIndexOf("|");
            const valueWoParams = paramsOffs === -1 || value[paramsOffs - 1] === "|" ? value : value.substr(0, paramsOffs).trim();
            this.params = paramsOffs === -1 ? {} : new ParamParser(value.substr(paramsOffs + 1).trim()).parse();

            if (match = /^for ([a-zA-Z]+) in (.*)/.exec(valueWoParams)) {
                this.type = "for";
                this.for = { itemName: match[1], array: new ExpressionParser(match[2]).parse() };
            } else if (match = /^if (.*)/.exec(valueWoParams)) {
                this.type = "if";
                this.if = { condition: new ExpressionParser(match[1]).parse() };
            } else if (match = /^elif (.*)/.exec(valueWoParams)) {
                this.type = "elif";
                this.elif = { condition: new ExpressionParser(match[1]).parse() };
            } else if (match = /^\/(for|if)$/.exec(valueWoParams)) {
                this.type = match[1] === "if" ? "endif" : "endfor";
            } else if (match = /^else$/.exec(valueWoParams)) {
                this.type = "else";
            } else {
                this.type = "template";
                this.template = { expr: new ExpressionParser(valueWoParams).parse() };
            }
        }
    }

    repr() {
        return `${this.type}: "${this.value.replace(/\n/g, "\\n")}"`;
    }
}