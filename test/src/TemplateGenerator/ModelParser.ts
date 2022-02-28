import { UnresolvedType } from "@one/One/Ast/AstTypes";
import { Expression, InstanceOfExpression } from "@one/One/Ast/Expressions";
import { ExpressionParser, IExpressionParserHooks } from "@one/Parsers/Common/ExpressionParser";
import { LinePositionStore, Reader } from "@one/Parsers/Common/Reader";
import { Block, EmptyLine, Node, RootBlock, TextLine } from "./BlockParser";
import { BlockNode, Case, ElIfNode, ElseNode, Empty, ForNode, GeneratorTemplateFile, IfNode, ParamsNode, SwitchNode, TemplateBlock, TemplateNode, TemplateNodeWithBody, TypeTemplate, UsingNode } from "./TemplateModel";

export class TmplExpressionParser implements IExpressionParserHooks {
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

export class TmplTreeConverter {
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