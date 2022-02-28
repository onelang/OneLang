import { readFile, writeFile, baseDir } from './Utils/TestUtils';
import { LinePositionStore, Reader } from "@one/Parsers/Common/Reader";
import { ExpressionParser, IExpressionParserHooks } from '@one/Parsers/Common/ExpressionParser';
import { Expression, InstanceOfExpression } from '@one/One/Ast/Expressions';
import { UnresolvedType } from '@one/One/Ast/AstTypes';

interface ITreeBuilder {
    addLine(line: Node);
    finish(): RootBlock;
}

class Node {
    public byteOffset = -1;
    public lineIdx = -1;
    public padLen = -1;
}

class EmptyLine extends Node { }

class TextLine extends Node {
    constructor(public text: string) { super(); }
}

class Block extends Node {
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

class RootBlock extends Block {
    constructor() { super("root"); }
}

class TemplateNode {
    public node: Node;
    public params: { [name: string]: string } = {};
}

class GeneratorTemplateFile extends TemplateNode {
    constructor(public typeTemplates: TypeTemplate[]) { super(); }
}

class TemplateNodeWithBody extends TemplateNode {
    constructor(public body: TemplateBlock) { super(); }
}

class TypeTemplate extends TemplateNodeWithBody {
    constructor(
        public typeName: string,
        public varAlias: string,
        public body: TemplateBlock) { super(body); }
}

class Case extends TemplateNodeWithBody {
    constructor(public matchExpr: Expression, public body: TemplateBlock) { super(body); }
}

class ElseNode extends TemplateNodeWithBody {
    constructor(public body: TemplateBlock) { super(body); }
}

class IfNode extends TemplateNodeWithBody {
    public elifs: IfNode[] = [];
    public else_: TemplateBlock = null;

    constructor(
        public condition: Expression,
        public then_: TemplateBlock) { super(then_); }
}

class ElIfNode extends TemplateNodeWithBody {
    constructor(
        public condition: Expression,
        public then_: TemplateBlock) { super(then_); }
}

class UsingNode extends TemplateNode {
    constructor(public using: string) { super(); }
}

class TemplateBlock extends TemplateNode {
    constructor(public children: TemplateNode[]) { super(); }
}

class SwitchNode extends TemplateNode {
    constructor(
        public switchExpr: Expression,
        public cases: Case[],
        public else_: ElseNode) { super(); }
}

class ForNode extends TemplateNodeWithBody {
    constructor(
        public itemsExpr: Expression, 
        public body: TemplateBlock) {
            super(body);
    }
}

class BlockNode extends TemplateNodeWithBody {
    constructor(public body: TemplateBlock) {
        super(body);
    }
}

class ParamsNode extends TemplateNodeWithBody {
    constructor(public body: TemplateBlock) {
        super(body);
    }
}

class Empty extends TemplateNode { }

class TmplExpressionParser implements IExpressionParserHooks {
    public parser: ExpressionParser;

    constructor(public reader: Reader) {
        this.parser = new ExpressionParser(reader, this);
    }

    unaryPrehook(): Expression {
        return null;
    }

    infixPrehook(left: Expression): Expression {
        if (this.reader.readToken("instanceof")) {
            const type = this.reader.readIdentifier();
            return new InstanceOfExpression(left, new UnresolvedType(type, null));
        }
        return null;
    }

    parse(): Expression {
        return this.parser.parse();
    }
}

class TreeConverter {
    linePosStore: LinePositionStore;

    constructor(input: string = null) {
        this.linePosStore = input === null ? null : new LinePositionStore(input);
    }

    fail(node: Node, errorMsg: string) {
        if (node && this.linePosStore !== null) {
            const cursor = this.linePosStore.getCursorFor(node.byteOffset + node.padLen);
            throw new Error(`[${cursor.line + 1}:${cursor.column + 1}] ${errorMsg}`);
        } else {
            throw new Error(errorMsg);
        }
    }

    parseExpression(reader: Reader, optional = false): Expression {
        if (optional && reader.eof)
            return null;
        return new TmplExpressionParser(reader).parse();
    }

    convertBlock(block: Block, body: TemplateBlock): TemplateNode {
        const reader = new Reader(block.args);
        reader.identifierRegex = "[A-Za-z_][A-Za-z0-9_-]*";

        let result: TemplateNode = null;
        if (block.type === "template") {
            const typeName = reader.readIdentifier();
            const varAlias = reader.readIdentifier();
            result = new TypeTemplate(typeName, varAlias, body);
        } else if (block.type === "case") {
            const matchExpr = this.parseExpression(reader);
            result = new Case(matchExpr, body);
        } else if (block.type === "switch") {
            const switchExpr = this.parseExpression(reader, true);
            const cases: Case[] = [];
            let else_: ElseNode = null;
            for (const child of body.children) {
                if (child instanceof Empty) continue;

                if (else_ !== null)
                    this.fail(child.node, "No node allowed after the #else node.");

                if (child instanceof Case)
                    cases.push(child);
                else if (child instanceof ElseNode)
                    else_ = child;
                else
                    this.fail(child.node, "Only #case and #else allowed here.");
            }
            result = new SwitchNode(switchExpr, cases, else_);
        } else if (block.type === "else") {
            result = new ElseNode(body);
        } else if (block.type === "elif") {
            const condition = this.parseExpression(reader);
            result = new ElIfNode(condition, body);
        } else if (block.type === "if") {
            const condition = this.parseExpression(reader);
            result = new IfNode(condition, body);
        } else if (block.type === "using") {
            result = new UsingNode(reader.readAll());
        } else if (block.type === "for") {
            const itemsExpr = this.parseExpression(reader);
            result = new ForNode(itemsExpr, body);
        } else if (block.type === "block") {
            result = new BlockNode(body);
        } else if (block.type === "params") {
            result = new ParamsNode(body);
        } else {
            this.fail(block, `Unknown block type: ${block.type}`);
        }

        result.node = block;

        while (true) {
            const name = reader.readIdentifier();
            if (name === null) break;
            
            let value: string = null;
            if (reader.readToken("="))
                value = reader.readString();

            result.params[name] = value;
        }

        if (reader.readToken(":")) {
            reader.readToken(" ");
            const inlineTmpl = reader.readUntil("\n", true);
            // ignore lines ending with ":\n" (probaby just left there as a mistake)
            if (inlineTmpl !== "") {
                if (result instanceof TemplateNodeWithBody) {
                    if (result.body.children.length !== 0)
                        this.fail(result.node, "Block has inline body, so it is not allowed to set explicit body too.");
                    result.body.children.push(this.convertText(inlineTmpl, block));
                } else
                    this.fail(result.node, "This block cannot have template definition.");
            }
        }

        if (!reader.eof)
            this.fail(block, `Block is not processed fully. Remaining: ${reader.readAll()}`);

        return result;
    }

    convertText(text: string, node: Node): TemplateNode {
        return new TemplateNode();
    }

    convertRootNode(rootNode: RootBlock) {
        const children = rootNode.children.map(x => this.convertNode(x));
        const typeTemplates: TypeTemplate[] = [];
        for (const child of children) {
            if (child instanceof TypeTemplate) {
                typeTemplates.push(child);
            } else if (child instanceof Empty) {
            } else
                this.fail(child.node, "Only #template nodes are allowed as the root node of a template file");
        }
        return new GeneratorTemplateFile(typeTemplates);
    }

    convertNode(node: Node): TemplateNode {
        if (node instanceof Block) {
            const children = node.children.map(x => this.convertNode(x));
            return this.convertBlock(node, new TemplateBlock(children));
        } else if (node instanceof EmptyLine) {
            return new Empty();
        } else if (node instanceof TextLine) {
            return this.convertText(node.text, node);
        } else
            this.fail(node, `Unexpected node type`);
    }
}

class TreeBuilder implements ITreeBuilder {
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
class LineParser {
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

function stringifyTree(node: Node, blockChar = ' ', childChar = ' ') {
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
                pad + stringifyTree(x, blockChar, childChar).replace(/\n/g, '\n' + pad)).join("\n");
        }
        return result;
    }
}

const tmplStr = readFile("src/Generator/Csharp.tmpl");
const treeBuilder = new TreeBuilder();
const root = LineParser.parse(tmplStr, treeBuilder);
console.log(root);
console.log(stringifyTree(root, '_', '.'));
const treeStr = stringifyTree(root).replace(/\n +(?=\n)/g, "\n");
if (treeStr !== tmplStr) {
    writeFile("src/Generator/Csharp.tmpl.gen", treeStr);
    debugger;
}
const tmplTree = new TreeConverter(tmplStr).convertRootNode(root);
debugger;