import { TemplateAst as Ast } from "./TemplateAst";
import { ExprLangAst as ExprAst } from "../ExprLang/ExprLangAst";
import { ExprLangParser } from "../ExprLang/ExprLangParser";

/**
 * Some info about this AST:
 *  - It's a line based parser, a line can be: template or control line
 *    - control line: can be "if", "elif", "else", "for", "endif" ("/if"), "endfor" ("/for")
 *    - template line: array of string literals, template expressions and inline ifs
 *  - There is no inline for (this is invalid: "{{for item in array}}{{item.something}}{{/for}}")
 *  - Template line generates an "\n" at the end
 *  - Control line does not generate an "\n" (it's added by the TemplateGenerator at run-time if needed)
 *  - If a template line contains only one inline "if" then it is converted into a control line type "if"
 *  - If the "inline" template argument specified for an "if" or "for" then it's inlined into the text
 *    (the previous and next "\n" character will be removed)
 */

type TemplatePartType = "text"|"template"|"for"|"if"|"elif"|"else"|"endif"|"endfor";

class TemplatePart {
    type: TemplatePartType;
    params: { [name: string]: string|boolean } = {};

    textValue: string;
    for: { itemName: string, array: ExprAst.Expression };
    if: { condition: ExprAst.Expression };
    elif: { condition: ExprAst.Expression };
    template: { expr: ExprAst.Expression };
    
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
                this.for = { itemName: match[1], array: ExprLangParser.parse(match[2]) };
            } else if (match = /^if (.*)/.exec(valueWoParams)) {
                this.type = "if";
                this.if = { condition: ExprLangParser.parse(match[1]) };
            } else if (match = /^elif (.*)/.exec(valueWoParams)) {
                this.type = "elif";
                this.elif = { condition: ExprLangParser.parse(match[1]) };
            } else if (match = /^\/(for|if)$/.exec(valueWoParams)) {
                this.type = match[1] === "if" ? "endif" : "endfor";
            } else if (match = /^else$/.exec(valueWoParams)) {
                this.type = "else";
            } else {
                this.type = "template";
                this.template = { expr: ExprLangParser.parse(valueWoParams) };
            }
        }
    }

    repr() {
        return `${this.type}: "${this.value.replace(/\n/g, "\\n")}"`;
    }
}

class ParamParser {
    pos = 0;
    params: { [name: string]: string|boolean } = { };

    constructor(public str: string) { }

    readToken(...tokens: string[]) {
        for (const token of tokens)
            if (this.str.startsWith(token, this.pos)) {
                this.pos += token.length;
                return token;
            }
        return null;
    }

    readUntil(...tokens: string[]) {
        const startPos = this.pos;
        let token = null;
        for (; this.pos < this.str.length; this.pos++)
            if (token = this.readToken(...tokens))
                break;

        const value = this.str.substring(startPos, this.pos - (token||"").length);
        return { value, token };
    }

    parse() {
        while (this.pos < this.str.length) {
            const key = this.readUntil("=", " ");
            if(key.token !== "=")
                this.params[key.value] = true;
            else {
                const quote = this.readToken("'", "\"");
                const value = this.readUntil(quote || " ").value;
                this.params[key.value] = value.replace(/\\n/g, "\n");
            }
        }

        return this.params;
    }
}

class LineInfo {
    parts: TemplatePart[];
    controlPart: TemplatePart;
    indentLen = 0;

    constructor(public line: string, public lineIdx: number) {
        this.parts = this.line.split(/\{\{([^{}]*?)\}\}/).map((x,i) => new TemplatePart(x, i % 2 === 0))
            .filter(x => !(x.type === "text" && x.textValue.length === 0));

        const nonWs = this.parts.filter(x => !x.isWhitespace);
        this.controlPart = nonWs.length === 1 && (nonWs[0].type !== "text" 
            && nonWs[0].type !== "template") ? nonWs[0] : null;

        for (const c of line)
            if (c === " ")
                this.indentLen++;
            else
                break;
    }

    match(...types: TemplatePartType[]) {
        return this.controlPart && types.includes(this.controlPart.type);
    }

    fail(msg: string) {
        throw new Error(`${msg} (lineIdx: ${this.lineIdx}, line: '${this.line}'`);
    }

    get inline() { return this.controlPart && !!this.controlPart.params["inline"] }
    get sep() {
        return !this.controlPart ? null :
            "sep" in this.controlPart.params ? <string>this.controlPart.params["sep"] :
            (this.inline ? "" : "\n");
    }
}

class TemplateLineParser {
    parts: TemplatePart[];
    partIdx = -1;
    root: Ast.Line;

    constructor(public line: LineInfo) {
        this.parts = line.parts;
        this.root = this.readBlock();
    }

    get currPart() { return this.parts[this.partIdx]; }

    readIf() {
        const ifNode = new Ast.IfNode();
        ifNode.inline = !!this.currPart.params["inline"];

        const ifItem = new Ast.IfItem(this.currPart.if.condition);
        ifItem.body = this.readBlock();
        ifNode.items.push(ifItem);

        while(true) {
            const currPart = this.currPart;
            if (currPart.type === "elif") {
                const elifBlock = this.readBlock();
                const newItem = new Ast.IfItem(currPart.elif.condition, elifBlock);
                ifNode.items.push(newItem);
            } else if (currPart.type === "else") {
                ifNode.else = this.readBlock();
            } else if (currPart.type === "endif") {
                break;
            } else {
                this.line.fail(`Expected 'elif', 'else' or 'endif', got '${currPart.type}'.`);
            }
        }

        return ifNode;
    }

    readBlock() {
        this.partIdx++;
        const line = new Ast.Line();

        for (; this.partIdx < this.parts.length; this.partIdx++) {
            let node: Ast.LineItem;

            const part = this.currPart;
            if (part.type === "text") {
                node = new Ast.TextNode(part.textValue);
            } else if (part.type === "template") {
                node = new Ast.TemplateNode(part.template.expr);
            } else if (part.type === "if") {
                node = this.readIf();
            } else {
                break;
            }

            line.items.push(node);
        }

        return line;
    }
}

export class TemplateParser {
    levelIndent = 2;

    lines: LineInfo[];
    lineIdx = -1;
    root: Ast.Block;
    indentLen = -this.levelIndent;

    constructor(public template: string) {
        this.lines = template.split("\n").map((line, lineIdx) => new LineInfo(line, lineIdx));
        this.root = this.readBlock(true);
    }

    get currLine() { return this.lines[this.lineIdx]; }

    match(...types: TemplatePartType[]) {
        const line = this.lines[this.lineIdx];
        return line.controlPart && types.includes(line.controlPart.type);
    }

    readIf() {
        const ifNode = new Ast.IfNode();
        ifNode.inline = this.currLine.inline;
        
        const ifItem = new Ast.IfItem(this.currLine.controlPart.if.condition, this.readBlock());
        ifNode.items.push(ifItem);

        while(true) {
            const currLine = this.currLine;
            if (currLine.match("elif")) {
                const newItem = new Ast.IfItem(currLine.controlPart.elif.condition, this.readBlock())
                ifNode.items.push(newItem);
            } else if (currLine.match("else")) {
                ifNode.else = this.readBlock();
            } else if (currLine.match("endif")) {
                break;
            } else {
                currLine.fail("Expected 'elif', 'else' or 'endif'.");
            }
        }

        return ifNode;
    }

    readFor() {
        const part = this.currLine.controlPart;
        const forNode = new Ast.ForNode(part.for.itemName, part.for.array, this.currLine.inline, this.currLine.sep);
        forNode.body = this.readBlock();
        
        if (this.currLine.match("else")) {
            forNode.else = this.readBlock();
        } else if (!this.currLine.match("endfor")) {
            this.currLine.fail("Expected 'else' or 'endfor'.");
        }
        
        return forNode;
    }

    getIndentLen(str: string) {
        let len = 0;
        for (const c of str)
            if (c === " ")
                len++;
            else
                break;
        return len;
    }

    deindentLine() {
        if (this.currLine.parts.length === 0 || this.indentLen === 0) return;

        if (this.currLine.indentLen < this.indentLen)
            this.currLine.fail(`Expected at least ${this.indentLen} indentation`);

        const part0 = this.currLine.parts[0];
        part0.textValue = part0.textValue.substr(this.indentLen);
    }

    readBlock(rootBlock = false) {
        // whitespace DOES NOT matter before *inline* "if"s / "for"s
        // but whitespace DOES matter before non-inline "if"s / "for"s
        const prevIndent = this.indentLen;
        this.indentLen = (this.currLine && this.currLine.inline ? this.currLine.indentLen : this.indentLen) + this.levelIndent;

        const lineNodes: Ast.BlockItem[] = [];
        this.lineIdx++;
        
        for (; this.lineIdx < this.lines.length; this.lineIdx++) {
            let blockItem: Ast.BlockItem;

            const line = this.currLine;

            if (line.match("if")) {
                blockItem = this.readIf();
            } else if (line.match("for")) {
                blockItem = this.readFor();
            } else if (!line.controlPart) {
                this.deindentLine();
                const lineNode = new TemplateLineParser(this.currLine).root;
                const part0 = lineNode.items[0];
                lineNode.indentLen = part0 instanceof Ast.TextNode ? this.getIndentLen(part0.value) : 0;
                
                // if the whole line is a standalone "inline if" (eg "{{if cond}}something{{/if}}"),
                //   then it converts it to a "control if" (newline only added if generates code)
                if (lineNode.items.length === 1 && lineNode.items[0] instanceof Ast.IfNode)
                    blockItem = <Ast.IfNode> lineNode.items[0];
                else
                    blockItem = lineNode;
            } else {
                break;
            }

            lineNodes.push(blockItem);
        }

        // concat lines together if one of them is an inline line
        const block = new Ast.Block();
        let prevLine: Ast.Line = null;
        for (let i = 0; i < lineNodes.length; i++) {
            const lineNode = lineNodes[i];
            const canInline = prevLine !== null && (!(lineNode instanceof Ast.Line) || lineNode.indentLen >= prevLine.indentLen);
            if (canInline && (lineNode.inline || lineNodes[i - 1].inline)) {
                if (lineNode instanceof Ast.Line) {
                    if (prevLine.indentLen > 0) {
                        const firstItem = (<Ast.TextNode>lineNode.items[0]);
                        firstItem.value = firstItem.value.substr(prevLine.indentLen);
                    }
                    prevLine.items.push(...lineNode.items);
                } else
                    prevLine.items.push(lineNode);
            } else {
                block.lines.push(lineNode);
                if (lineNode instanceof Ast.Line) {
                    prevLine = lineNode;
                    const firstItem = prevLine.items[0];
                    if (firstItem instanceof Ast.TextNode)
                        prevLine.indentLen = this.getIndentLen(firstItem.value);
                }
            }
        }

        for (const line of block.lines)
            delete line.inline;

        for (const line of block.lines) {
            if (line instanceof Ast.Line) {
                const firstItem = line.items[0];
                if (firstItem instanceof Ast.TextNode) {
                    line.indentLen = this.getIndentLen(firstItem.value);
                    firstItem.value = firstItem.value.substr(line.indentLen);
                    if (firstItem.value === "")
                        line.items.shift();
                }
            }
        }

        this.indentLen = prevIndent;
        return block;
    }

    static parse(template: string) {
        return new TemplateParser(template).root;
    }
}