import { TemplatePart, TemplatePartType } from "./TemplatePart";
import { TemplateAst as Ast } from "./TemplateAst";

class LineInfo {
    parts: TemplatePart[];
    controlPart: TemplatePart;

    constructor(public line: string, public lineIdx: number) {
        this.parts = this.line.split(/\{\{([^{}]*?)\}\}/).map((x,i) => new TemplatePart(x, i % 2 === 0))
            .filter(x => !(x.type === "text" && x.textValue.length === 0));

        const nonWs = this.parts.filter(x => !x.isWhitespace);
        this.controlPart = nonWs.length === 1 && (nonWs[0].type !== "text" 
            && nonWs[0].type !== "template") ? nonWs[0] : null;
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
    root: Ast.Block;

    constructor(public line: LineInfo) {
        this.parts = line.parts;
        this.root = this.readBlock();
    }

    get currPart() { return this.parts[this.partIdx]; }

    readIf() {
        const ifNode = new Ast.IfNode();
        ifNode.inline = true;

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
        const block = new Ast.Block();

        for (; this.partIdx < this.parts.length; this.partIdx++) {
            let node: Ast.Node;

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

            block.items.push(node);
        }

        return block;
    }
}

export class TemplateParser {
    lines: LineInfo[];
    lineIdx = -1;
    root: Ast.Block;
    indentLevel = -1;
    nl = new Ast.TextNode("\n");

    constructor(public template: string) {
        this.lines = template.split("\n").map((line, lineIdx) => new LineInfo(line, lineIdx));
        this.root = this.readBlock();
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

    atleastIndent(str: string, len: number) {
        if (len > str.length) return false;

        for (let i = 0; i < len; i++)
            if (str[i] !== " ")
                return false;

        return true;
    }

    deindentLine() {
        if (this.currLine.parts.length === 0 || this.indentLevel === 0) return;
        const part0 = this.currLine.parts[0];

        const indentLen = this.indentLevel * 2;
        if (part0.type !== "text") {
            this.currLine.fail(`Expected line start with text node, got '${part0.type}'.`);
        } else if (!this.atleastIndent(part0.textValue, indentLen)) {
            this.currLine.fail(`Expected at least ${indentLen} indentation`);
        } else {
            part0.textValue = part0.textValue.substr(indentLen);
        }
    }

    readBlock(skipCurrent = true) {
        const block = new Ast.Block();
        this.indentLevel++;

        const removeLastNl = () => {
            if (block.items[block.items.length - 1] === this.nl)
                block.items.pop();
        };

        this.lineIdx++;
        for (; this.lineIdx < this.lines.length; this.lineIdx++) {
            let newNodes: Ast.Node[] = [];

            const line = this.currLine;

            if (line.inline)
                removeLastNl();

            if (line.match("if")) {
                newNodes.push(this.readIf());
            } else if (line.match("for")) {
                newNodes.push(this.readFor());
            } else if (!line.controlPart) {
                this.deindentLine();
                const items = new TemplateLineParser(this.currLine).root.items;

                const ifLine = items.length === 1 && items[0] instanceof Ast.IfNode;
                if (!ifLine)
                    items.push(this.nl);
                else
                    (<Ast.IfNode>items[0]).inline = false;

                newNodes.push(...items);
            } else {
                break;
            }

            block.items.push(...newNodes);
        }

        removeLastNl();
        this.indentLevel--;
        return block;
    }
}