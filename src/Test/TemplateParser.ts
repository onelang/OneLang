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
        const forPart = this.currLine.controlPart.for;
        const forNode = new Ast.ForNode(forPart.itemName, forPart.array);
        forNode.body = this.readBlock();
        
        if (this.currLine.match("else")) {
            forNode.else = this.readBlock();
        } else if (!this.currLine.match("endfor")) {
            this.currLine.fail("Expected 'else' or 'endfor'.");
        }
        
        return forNode;
    }

    readBlock(skipCurrent = true) {
        const block = new Ast.Block();
        
        this.lineIdx++;
        for (; this.lineIdx < this.lines.length; this.lineIdx++) {
            let newNodes: Ast.Node[];

            const line = this.currLine;
            if (line.match("if")) {
                newNodes = [this.readIf()];
            } else if (line.match("for")) {
                newNodes = [this.readFor()];
            } else if (!line.controlPart) {
                newNodes = new TemplateLineParser(this.currLine).root.items;
            } else {
                break;
            }

            block.items.push(...newNodes);
        }

        return block;
    }
}