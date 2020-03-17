import { ExprLangParser } from "../ExprLang/ExprLangParser";
import { IExpression } from "../ExprLang/ExprLangAst";
import { Line, IfNode, IfItem, LineItem, TextNode, TemplateNode, Block, ForNode, BlockItem } from "./TemplateAst";

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

enum TemplatePartType { Text, Template, For, If, Elif, Else, EndIf, EndFor }

class ForData { 
    constructor(public itemName: string, public array: IExpression) { }
}

class IfData {
    constructor(public condition: IExpression) { }
}

class TemplateData {
    constructor(public expr: IExpression) { }
}

class TemplatePart {
    type: TemplatePartType;
    params: { [name: string]: string } = {};

    textValue: string;
    for: ForData;
    if: IfData;
    elif: IfData;
    template: TemplateData;
    
    isWhitespace = false;

    constructor(public value: string, isText: boolean) {
        let match: RegExpExecArray = null;
        if (isText) {
            this.type = TemplatePartType.Text;
            this.textValue = value;
            this.isWhitespace = !!value.match(/^\s*$/);
        } else {
            const paramsOffs = value.lastIndexOf("|");
            const valueWoParams = paramsOffs === -1 || value.charAt(paramsOffs - 1) === "|" ? value : value.substr(0, paramsOffs).trim();
            this.params = paramsOffs === -1 ? <{ [name: string]: string }> {} : new ParamParser(value.substr(paramsOffs + 1).trim()).parse();

            if (match = /^for ([a-zA-Z]+) in (.*)/.exec(valueWoParams)) {
                this.type = TemplatePartType.For;
                this.for = new ForData(match[1], ExprLangParser.parse(match[2]));
            } else if (match = /^if (.*)/.exec(valueWoParams)) {
                this.type = TemplatePartType.If;
                this.if = new IfData(ExprLangParser.parse(match[1]));
            } else if (match = /^elif (.*)/.exec(valueWoParams)) {
                this.type = TemplatePartType.Elif;
                this.elif = new IfData(ExprLangParser.parse(match[1]));
            } else if (match = /^\/(for|if)$/.exec(valueWoParams)) {
                this.type = match[1] === "if" ? TemplatePartType.EndIf : TemplatePartType.EndFor;
            } else if (match = /^else$/.exec(valueWoParams)) {
                this.type = TemplatePartType.Else;
            } else {
                this.type = TemplatePartType.Template;
                this.template = new TemplateData(ExprLangParser.parse(valueWoParams));
            }
        }
    }

    repr() {
        return `${this.type}: "${this.value.replace(/\n/g, "\\n")}"`;
    }
}

class ReadUntilResult {
    constructor(public value: string, public token: string) { }
}

class ParamParser {
    pos = 0;
    params: { [name: string]: string } = { };

    constructor(public str: string) { }

    readToken(tokens: string[]): string {
        for (const token of tokens)
            if (this.str.startsWith(token, this.pos)) {
                this.pos += token.length;
                return token;
            }
        return null;
    }

    readUntil(tokens: string[]) {
        const startPos = this.pos;
        let token: string = null;
        for (; this.pos < this.str.length; this.pos++)
            if (token = this.readToken(tokens))
                break;

        const value = this.str.substring(startPos, this.pos - (token||"").length);
        return new ReadUntilResult(value, token);
    }

    parse(): { [name: string]: string } {
        while (this.pos < this.str.length) {
            const key = this.readUntil(["=", " "]);
            if(key.token !== "=")
                this.params[key.value] = "true";
            else {
                const quote = this.readToken(["'", "\""]);
                const value = this.readUntil([quote || " "]).value;
                this.params[key.value] = value.replace(/\\n/g, "\n");
            }
        }

        return this.params;
    }
}

class LineInfo {
    parts: TemplatePart[] = [];
    controlPart: TemplatePart;
    indentLen = 0;

    constructor(public line: string, public lineIdx: number) {
        const lineParts = this.line.split(/\{\{([^{}]*?)\}\}/);
        for (let i = 0; i < lineParts.length; i++) {
            const part = new TemplatePart(lineParts[i], i % 2 === 0);
            if (!(part.type === TemplatePartType.Text && part.textValue.length === 0))
                this.parts.push(part);
        }

        const nonWs = this.parts.filter(x => !x.isWhitespace);
        this.controlPart = nonWs.length === 1 && (nonWs[0].type !== TemplatePartType.Text 
            && nonWs[0].type !== TemplatePartType.Template) ? nonWs[0] : null;

        for (let i = 0; i < line.length; i++)
            if (line[i] === " ")
                this.indentLen++;
            else
                break;
    }

    match(type: TemplatePartType) {
        return this.controlPart !== null && this.controlPart.type === type;
    }

    fail(msg: string) {
        throw new Error(`${msg} (lineIdx: ${this.lineIdx}, line: '${this.line}'`);
    }

    get inline() { return this.controlPart !== null && this.controlPart.params["inline"] === "true"; }
    get sep() {
        return this.controlPart === null ? null :
            "sep" in this.controlPart.params ? this.controlPart.params["sep"] :
            (this.inline ? "" : "\n");
    }
}

class TemplateLineParser {
    parts: TemplatePart[];
    partIdx = -1;
    root: Line;

    constructor(public line: LineInfo) {
        this.parts = line.parts;
        this.root = this.readBlock();
    }

    get currPart() { return this.parts[this.partIdx]; }

    readIf() {
        const ifNode = new IfNode();
        ifNode.inline = this.currPart.params["inline"] === "true";

        const ifItem = new IfItem(this.currPart.if.condition, this.readBlock());
        ifNode.items.push(ifItem);

        while(true) {
            const currPart = this.currPart;
            if (currPart.type === TemplatePartType.Elif) {
                const elifBlock = this.readBlock();
                const newItem = new IfItem(currPart.elif.condition, elifBlock);
                ifNode.items.push(newItem);
            } else if (currPart.type === TemplatePartType.Else) {
                ifNode.else = this.readBlock();
            } else if (currPart.type === TemplatePartType.EndIf) {
                break;
            } else {
                this.line.fail(`Expected 'elif', 'else' or 'endif', got '${currPart.type}'.`);
            }
        }

        return ifNode;
    }

    readBlock(): Line {
        this.partIdx++;
        const line = new Line();

        for (; this.partIdx < this.parts.length; this.partIdx++) {
            let node: LineItem;

            const part = this.currPart;
            if (part.type === TemplatePartType.Text) {
                node = new TextNode(part.textValue);
            } else if (part.type === TemplatePartType.Template) {
                node = new TemplateNode(part.template.expr);
            } else if (part.type === TemplatePartType.If) {
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

    lines: LineInfo[] = [];
    lineIdx = -1;
    root: Block;
    indentLen = -this.levelIndent;

    constructor(public template: string) {
        const lines = template.split(/\n/g);
        for (let i = 0; i < lines.length; i++)
            this.lines.push(new LineInfo(lines[i], i));
        this.root = this.readBlock(true);
    }

    get currLine() { return this.lines[this.lineIdx]; }

    match(types: TemplatePartType[]) {
        const line = this.lines[this.lineIdx];
        return line.controlPart !== null && types.includes(line.controlPart.type);
    }

    readIf() {
        const ifNode = new IfNode();
        ifNode.inline = this.currLine.inline;
        
        const ifItem = new IfItem(this.currLine.controlPart.if.condition, this.readBlock());
        ifNode.items.push(ifItem);

        while(true) {
            const currLine = this.currLine;
            if (currLine.match(TemplatePartType.Elif)) {
                const newItem = new IfItem(currLine.controlPart.elif.condition, this.readBlock());
                ifNode.items.push(newItem);
            } else if (currLine.match(TemplatePartType.Else)) {
                ifNode.else = this.readBlock();
            } else if (currLine.match(TemplatePartType.EndIf)) {
                break;
            } else {
                currLine.fail("Expected 'elif', 'else' or 'endif'.");
            }
        }

        return ifNode;
    }

    readFor() {
        const part = this.currLine.controlPart;
        const forNode = new ForNode(part.for.itemName, part.for.array, this.currLine.inline, this.currLine.sep);
        forNode.body = this.readBlock();
        
        if (this.currLine.match(TemplatePartType.Else)) {
            forNode.else = this.readBlock();
        } else if (!this.currLine.match(TemplatePartType.EndFor)) {
            this.currLine.fail("Expected 'else' or 'endfor'.");
        }
        
        return forNode;
    }

    getIndentLen(str: string) {
        let len = 0;
        for (let i = 0; i < str.length; i++)
            if (str[i] === " ")
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

    readBlock(rootBlock: boolean = false): Block {
        // whitespace DOES NOT matter before *inline* "if"s / "for"s
        // but whitespace DOES matter before non-inline "if"s / "for"s
        const prevIndent = this.indentLen;
        this.indentLen = (this.currLine !== null && this.currLine.inline ? this.currLine.indentLen : this.indentLen) + this.levelIndent;

        const lineNodes: BlockItem[] = [];
        this.lineIdx++;
        
        for (; this.lineIdx < this.lines.length; this.lineIdx++) {
            let blockItem: BlockItem;

            const line = this.currLine;

            if (line.match(TemplatePartType.If)) {
                blockItem = this.readIf();
            } else if (line.match(TemplatePartType.For)) {
                blockItem = this.readFor();
            } else if (line.controlPart === null) {
                this.deindentLine();
                const lineNode = new TemplateLineParser(this.currLine).root;
                const part0 = lineNode.items[0];
                lineNode.indentLen = part0 instanceof TextNode ? this.getIndentLen(part0.value) : 0;
                
                // if the whole line is a standalone "inline if" (eg "{{if cond}}something{{/if}}"),
                //   then it converts it to a "control if" (newline only added if generates code)
                if (lineNode.items.length === 1 && lineNode.items[0] instanceof IfNode)
                    blockItem = <IfNode> lineNode.items[0];
                else
                    blockItem = lineNode;
            } else {
                break;
            }

            lineNodes.push(blockItem);
        }

        // concat lines together if one of them is an inline line
        const block = new Block();
        let prevLine: Line = null;
        for (let i = 0; i < lineNodes.length; i++) {
            const lineNode = lineNodes[i];

            let canInline = prevLine !== null;
            if (lineNode instanceof Line)
                canInline = canInline && lineNode.indentLen >= prevLine.indentLen;

            if (canInline && (lineNode.isInline() || lineNodes[i - 1].isInline())) {
                if (lineNode instanceof Line) {
                    if (prevLine.indentLen > 0) {
                        const firstItem = (<TextNode>lineNode.items[0]);
                        firstItem.value = firstItem.value.substr(prevLine.indentLen);
                    }
                    
                    for (const item of lineNode.items)
                        prevLine.items.push(item);
                } else {
                    debugger;
                    // prevLine.items should contain LineItem, but lineNode is BlockItem
                    //prevLine.items.push(lineNode);
                }
            } else {
                block.lines.push(lineNode);
                if (lineNode instanceof Line) {
                    prevLine = lineNode;
                    const firstItem = prevLine.items[0];
                    if (firstItem instanceof TextNode)
                        prevLine.indentLen = this.getIndentLen(firstItem.value);
                }
            }
        }

        //for (const line of block.lines)
        //    delete line.inline;

        for (const line of block.lines) {
            if (line instanceof Line) {
                const firstItem = line.items[0];
                if (firstItem instanceof TextNode) {
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

    static parse(template: string): Block {
        return new TemplateParser(template).root;
    }
}