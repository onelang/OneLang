import { readFile, writeFile, baseDir } from './Utils/TestUtils';
import { LinePositionStore } from "@one/Parsers/Common/Reader";
import { extname } from 'path';

interface ITreeBuilder {
    reportPosition(pos: number);
    addEmpty();
    addBlock(padLen: number, header: string);
    addTextLine(padLen: number, fullLine: string);
}

class Node {
    constructor() { }
}

class EmptyNode extends Node { }

class Block extends Node {
    public childPad: number = 0;
    public children: Node[] = [];

    constructor(public hdrPad: number, public header: string) {
        super();
    }
}

class TextLine extends Node {
    constructor(public text: string) {
        super();
    }
}

class TreeBuilder implements ITreeBuilder {
    pos = 0;

    parentStack: Block[] = [];
    lastChildStack: Block[] = [];
    childPadStack: number[] = [];

    root = new Block(0, null);

    parent: Block = this.root;
    // cache for parent's last block child where new indented nodes can be appended
    // EMPTY lines does not invalidate this value, but TEXT lines do 
    //   (new node should be appended to parent after a TEXT line)
    lastChildBlock: Block = null;
    childPad = 0;

    pushState() {
        this.parentStack.push(this.parent);
        this.lastChildStack.push(this.lastChildBlock);
        this.childPadStack.push(this.childPad);
    }

    popState() {
        if (this.parentStack.length === 0) debugger;
        this.parent = this.parentStack.pop();
        this.lastChildBlock = this.lastChildStack.pop();
        this.childPad = this.childPadStack.pop();
    }
    
    reportPosition(pos: number) { this.pos = pos; }

    preparePlace(padLen: number) {
        // Case 1) newNode is below the lastChild
        // # parent
        //     # child 1
        //     # lastChild       -> new parent
        //         # newNode     -> new lastChild (if block)
        if (this.lastChildBlock !== null && padLen > this.childPad) {
            this.pushState();
            this.parent = this.lastChildBlock;
            this.lastChildBlock = null;
            this.parent.childPad = padLen - this.childPad;
            this.childPad = padLen;
            return;
        }

        // Case 2) newNode is not under current parent
        // # pop(parents)          - new parent
        //     # parent            - new lastChild
        //         # lastChild
        //     # newNode

        // Find the node which should be the parent of a node at padLen.
        while (padLen < this.childPad)
            this.popState();
    }

    addEmpty() {
        this.parent.children.push(new EmptyNode());
    }

    addBlock(padLen: number, header: string) {
        this.preparePlace(padLen);

        // Case 3)
        // # parent
        //     # lastChild
        //   # newBlock         -> inconsistent padding
        if (padLen < this.childPad)
            throw new Error("Inconsistent padding!");

        const newBlock = new Block(padLen - this.childPad, header);
        this.parent.children.push(newBlock);
        this.lastChildBlock = newBlock;
    }

    addTextLine(padLen: number, fullLine: string) {
        this.preparePlace(padLen);
        const text = fullLine.substring(this.childPad);
        this.parent.children.push(new TextLine(text));
        // this text line separates future nodes from the previous block
        this.lastChildBlock = null;
    }
}

// parses Generator Template file line-by-line and identifies block starts ("#") and
// delegates tree building to ITreeBuilder interface
class BlockParser {
    constructor(public input: string, public builder: ITreeBuilder, public blockStart = "#") { }

    static getPadLen(line: string) {
        for (let i = 0; i < line.length; i++)
            if (line[i] !== ' ')
                return i;
        return -1; // whitespace line => pad === 0
    }

    static parse(input: string, builder: ITreeBuilder, blockStart = "#") {
        let pos = 0;

        const lines = input.split('\n');
        for (const line of lines) {
            const padLen = BlockParser.getPadLen(line);
            builder.reportPosition(pos);

            if (padLen === -1) {
                builder.addEmpty();
                continue;
            }

            const isBlockStart = line.startsWith(blockStart, padLen);
            if (isBlockStart) {
                const blockHdr = line.substring(padLen + blockStart.length);
                builder.addBlock(padLen, blockHdr);
            } else {
                builder.addTextLine(padLen, line);
            }

            pos += line.length + 1;
        }
    }
}

function stringifyTree(node: Node) {
    if (node instanceof EmptyNode)
        return "";
    else if (node instanceof TextLine)
        return node.text;
    else if (node instanceof Block) {
        let result = node.header !== null ? ' '.repeat(node.hdrPad) + "#" + node.header : "";
        if (node.children.length > 0) {
            const pad = ' '.repeat(node.childPad);
            if (result !== "")
                result += "\n";

            result += node.children.map(x => 
                pad + stringifyTree(x).replace(/\n/g, '\n' + pad)).join("\n");
        }
        return result;
    }
}

const tmplStr = readFile("src/Generator/Csharp.tmpl");
const treeBuilder = new TreeBuilder();
BlockParser.parse(tmplStr, treeBuilder);
console.log(treeBuilder.root);
const treeStr = stringifyTree(treeBuilder.root).replace(/\n +(?=\n)/g, "\n");
console.log(treeStr);
debugger;