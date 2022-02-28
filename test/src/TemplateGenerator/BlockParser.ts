import { Reader } from "@one/Parsers/Common/Reader";

export interface ITreeBuilder {
    addLine(line: Node);
    finish(): RootBlock;
}

export class Node {
    public byteOffset = -1;
    public lineIdx = -1;
    public padLen = -1;
}

export class EmptyLine extends Node { }

export class TextLine extends Node {
    constructor(public text: string) { super(); }
}

export class Block extends Node {
    public blockPad: number = -1; // important, pads the whole block (~margin)
    public childPad: number = -1; // not important, only for debugging (~padding)
    public children: Node[] = [];
    public type: string = null;
    public args: string = null;

    constructor(public header: string) { 
        super();

        const reader = new Reader(header);
        this.type = reader.expectIdentifier();
        reader.readToken(" "); // optional
        this.args = reader.readAll();
    }
}

export class RootBlock extends Block {
    constructor() { super("root"); }
}

export class TreeBuilder implements ITreeBuilder {
    root: RootBlock = new RootBlock();
    curr: Block = this.root;
    blockStack: Block[] = [this.root];

    constructor() {
        this.root.padLen = -1;
        this.root.blockPad = 0;
    }

    finishBlock() {
        if (this.blockStack.length === 0) debugger;
        const parent = this.blockStack.pop();
        const ch = this.curr.children;

        // move empty lines from the end of block to the parent (empty lines 
        //   should only happen between two non-empty lines, except in root)
        if (ch.length > 0) {
            const insertAt = parent.children.length;
            while (ch[ch.length - 1] instanceof EmptyLine) {
                parent.children.splice(insertAt, 0, ch.pop());
            }
        }

        // re-calculate paddings now that we know all the children
        // #curr (Block), childPad = 3 (visualized as "-")
        // ---...someText - children[1] (TextLine) - first 3 space are cut down, other 3 is part of string
        // ---#block      - children[2] (Block)    - blockPad = 0
        // ---..#block    - children[3] (Block)    - blockPad = 2
        if (ch.length > 0) {
            let minPadLen = ch[0].padLen;
            for (const child of ch)
                if (child.padLen !== -1 && child.padLen < minPadLen)
                    minPadLen = child.padLen;

            this.curr.childPad = minPadLen - this.curr.padLen;

            for (const child of ch) {
                if (child instanceof TextLine)
                    child.text = child.text.substring(minPadLen);
                else if (child instanceof Block)
                    child.blockPad = child.padLen - minPadLen;
            }
        }

        this.curr = parent;
    }

    addLine(line: Node) {
        // if the line is outer of the current block padding then finish the current block (except if it is an empty line)
        while (line.padLen <= this.curr.padLen && !(line instanceof EmptyLine))
            this.finishBlock();

        this.curr.children.push(line);

        // if this is a block then this will be the current active block 
        //   (because it is under the previous block as line.padLen > curr.padLen is true)
        if (line instanceof Block) {
            this.blockStack.push(this.curr);
            this.curr = line;
        }
    }

    finish() {
        // finish all blocks
        while (this.blockStack.length > 0)
            this.finishBlock();

        // as root.padLen is a virtual "-1" (so all nodes at "0" will be its children),
        //   childPad becomes wrongfully +1 (as all children is padded +1), so this needs to be fixed
        this.root.childPad = 0;
        return this.root;
    }
}

// parses Generator Template file line-by-line and identifies block starts ("#") and
// delegates tree building to ITreeBuilder interface
export class LineParser {
    static getPadLen(line: string) {
        for (let i = 0; i < line.length; i++)
            if (line[i] !== ' ')
                return i;
        return -1; // whitespace line => pad === 0
    }

    static parse(input: string, treeBuilder: ITreeBuilder, blockStart = "#"): RootBlock {
        let lineIdx = 0;
        let byteOffset = 0;
        const lines = input.split('\n');
        for (const line of lines) {
            const padLen = LineParser.getPadLen(line);

            let node: Node = null;
            if (padLen === -1)
                node = new EmptyLine();
            else if (line.startsWith(blockStart, padLen))
                node = new Block(line.substring(padLen + blockStart.length));
            else
                node = new TextLine(line);
 
            node.byteOffset = byteOffset;
            node.lineIdx = lineIdx;
            node.padLen = padLen;
            treeBuilder.addLine(node);

            lineIdx++;
            byteOffset += line.length + 1;
        }

        return treeBuilder.finish();
    }
}

export class NodeVisualizer {
    static stringifyTree(node: Node, blockChar = ' ', childChar = ' ') {
        if (node instanceof EmptyLine)
            return "";
        else if (node instanceof TextLine)
            return node.text;
        else if (node instanceof Block) {
            let result = node instanceof RootBlock ? "" : blockChar.repeat(node.blockPad) + "#" + node.header;
            if (node.children.length > 0) {
                const pad = node.childPad < 0 ? "" : blockChar.repeat(node.blockPad) + childChar.repeat(node.childPad);
                if (result !== "")
                    result += "\n";
    
                result += node.children.map(x => 
                    pad + this.stringifyTree(x, blockChar, childChar).replace(/\n/g, '\n' + pad)).join("\n");
            }
            return result;
        }
    }
    
}
