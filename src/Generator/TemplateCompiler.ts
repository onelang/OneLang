import { AstNode, AstNodeType, OperatorWithOperand } from "./ExpressionLanguage/Parser";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";

class TemplateNode {
    children: TemplateNode[] = [];
    ifTrue: TemplateNode;
    ifFalse: TemplateNode;

    constructor(public value: TemplatePart, public parent: TemplateNode) { }

    repr(): string {
        let result = this.value ? this.value.repr() + "\n" : "";
        for (const item of this.children)
            result += item.repr().split("\n").map((x,i) => (i === 0 ? "- ": "  ") + x).join("\n") + "\n";
        result = result.substring(0, result.length - 1);
        return result;
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
                this.params[key.value] = value;
            }
        }

        return this.params;
    }
}

class TemplatePart {
    type: "text"|"template"|"for"|"if"|"else"|"closeNode";
    params: { [name: string]: string|boolean } = {};

    textValue: string;
    for: { itemName: string, array: AstNode };
    if: { condition: AstNode };
    closeNode: { tag: "for"|"if" };
    template: { expr: AstNode };

    constructor(public value: string, isText: boolean) {
        let match;
        if (isText) {
            this.type = "text";
            this.textValue = value;
        } else {
            const paramsOffs = value.lastIndexOf("|");
            const valueWoParams = paramsOffs === -1 || value[paramsOffs - 1] === "|" ? value : value.substr(0, paramsOffs).trim();
            this.params = paramsOffs === -1 ? {} : new ParamParser(value.substr(paramsOffs + 1).trim()).parse();

            if (match = /^for ([a-zA-Z]+) in (.*)/.exec(valueWoParams)) {
                this.type = "for";
                this.for = { itemName: match[1], array: ExpressionParser.parse(match[2]) };
            } else if (match = /^if (.*)/.exec(valueWoParams)) {
                this.type = "if";
                this.if = { condition: ExpressionParser.parse(match[1]) };
            } else if (match = /^\/(for|if)$/.exec(valueWoParams)) {
                this.type = "closeNode";
                this.closeNode = { tag: <"for"|"if">match[1] };
            } else if (match = /^else$/.exec(valueWoParams)) {
                this.type = "else";
            } else {
                this.type = "template";
                this.template = { expr: ExpressionParser.parse(valueWoParams) };
            }
        }
    }

    repr() {
        return `${this.type}: "${this.value.replace(/\n/g, "\\n")}"`;
    }
}

export class Template {
    treeRoot: TemplateNode;

    constructor(public template: string, public args: string[] = []) {
        this.treeRoot = this.generateTree();
        this.fixIndent(this.treeRoot);
        this.convertInlinedNodes(this.treeRoot);
    }

    convertInlinedNodes(node: TemplateNode) {
        if (node.value && node.value.params.inline && node.children.length > 0) {
            const first = node.children[0].value;
            const last = node.children.last().value;
            if (first.textValue)
                first.textValue = this.trimStart(first.textValue);
            if (last.textValue)
                last.textValue = this.trimEnd(last.textValue);
        }

        for (const child of node.children)
            this.convertInlinedNodes(child);
    }

    convertIdentifier(name: string, vars: string[], type: "variable"|"field"|"declaration") { return name; }

    fixIndent(node: TemplateNode, level = 0) {
        if (node.value && node.value.type === "text")
            node.value.textValue = node.value.textValue.replace(new RegExp(`\n {${level*2}}`,"g"), "\n");

        const deindentType = node.value && ["for", "if"].includes(node.value.type);
        for (const item of node.children)
            this.fixIndent(item, level + (deindentType ? 1 : 0));
    }

    generateTree() {
        const parts = this.template.split(/\{\{([^{}]*?)\}\}/).map((x,i) => new TemplatePart(x, i % 2 === 0));
        for (let i = 0; i < parts.length - 1; i++)
            if (parts[i].type === "text" && ["closeNode"].includes(parts[i + 1].type))
                parts[i].textValue = parts[i].textValue.replace(/\n\s*$/, "");

        const root = new TemplateNode(null, null);

        let current = root;
        for (let part of parts) {
            //console.log(part.type, part.for || part.if || part.template || part.closeNode);
            if (part.type === "closeNode") {
                if (part.closeNode.tag === "if")
                    current = current.parent;

                if (current.value.type !== part.closeNode.tag)
                    throw new Error(`Invalid close tag! Expected ${current.value.type}, got ${part.closeNode.tag}!`);

                current = current.parent;
            } else if (part.type === "else") {
                const ifTag = current.parent;
                current = ifTag.ifFalse = new TemplateNode(part, ifTag);
                ifTag.children.push(current);
            } else {
                const newNode = new TemplateNode(part, current);
                current.children.push(newNode);

                if (part.type === "if") {
                    current = newNode.ifTrue = new TemplateNode(part, newNode);
                    newNode.children.push(current);
                } else if (part.type === "for") {
                    current = newNode;
                }
            }
        }
        return root;
    }

    escapeJsString(str: string) {
        // TODO replace others
        const charsToQuote = ["'", "\"", "\\n", "\\r", "\\t", "\\v"];
        return charsToQuote.reduce((prev, char) => prev.replace(new RegExp(char, "g"), "\\" + char), str);
    }

    operandListToJS(opList: OperatorWithOperand[], vars: string[], isMember: boolean): string {
        return opList.reduce((prev, curr) =>
            `${prev}${curr.operator ? curr.operator.text : ""}${this.exprToJS(curr.operand, vars, curr.operator && curr.operator.text === ".")}` , "");
    }

    exprToJS(ast: AstNode, vars: string[], isMember: boolean): string {
        if (!ast) return "";
        
        if (ast.type === AstNodeType.Identifier) {
            if (/\d+/.exec(ast.identifier))
                return ast.identifier;
            else
                return this.convertIdentifier(ast.identifier, vars, isMember ? "field" : "variable");
        } else if (ast.type === AstNodeType.OperatorList) {
            return this.operandListToJS(ast.operands, vars, isMember);
        } else if (ast.type === AstNodeType.Function) {
            const argsText = ast.arguments.map(arg => this.exprToJS(arg, vars, false)).join(", ");

            const lastOp = ast.function.operands && ast.function.operands.last();
            if (lastOp && lastOp.operator.text === "." && lastOp.operand.identifier === "index") {
                return `${this.operandListToJS(ast.function.operands.slice(0, -1), vars, false)}[${argsText}]`;
            } else {
                return `${this.exprToJS(ast.function, vars, false)}(${argsText})`;
            }
        } else
            throw new Error(`Unhandled AST type: ${ast.type}!`);
    }

    trimStart(str: string) { return str.replace(/^(\s|\n)*/, ""); }
    trimEnd(str: string) { return str.replace(/(\s|\n)*$/, ""); }

    getChildren(node: TemplateNode, vars: string[], newVars: string[] = []) {
        if (!node) return "";

        const allVars = [...vars, ...newVars];
        const childTexts = (node.children||[]).map(child => this.templateToJS(child, allVars));
        for (let i = 0; i < childTexts.length; i++)
            if (node.children[i].value.params.inline === true) {
                childTexts[i - 1] = this.trimEnd(childTexts[i - 1]); // trim end
                childTexts[i] = childTexts[i].trim(); // trim start and end
                childTexts[i + 1] = this.trimStart(childTexts[i + 1]); // trim start
            }
        return childTexts.join("");
    }

    templateToJS(node: TemplateNode, vars: string[], padding = "") {
        let result = padding;

        if (node.value) {
            if (node.value.type === "text") {
                result += node.value.textValue.replace(/\\/g, "\\\\").replace(/\$/g, "\\$").replace(/`/g, "\\`");
            } else if (node.value.type === "for") {
                const varName = this.convertIdentifier(node.value.for.itemName, vars, "declaration");
                const forArray = this.exprToJS(node.value.for.array, vars, false);
                const sep = node.value.params.sep||"";
                const childrenText = this.getChildren(node, vars, [varName]).replace(/\n/g, "\n    ");
                result += `\${tmpl.Block((${forArray}||[]).map(${varName} => tmpl\`${childrenText}\`).join("${sep}"))}`;
            } else if (node.value.type === "if") {
                const conditionCode = this.exprToJS(node.value.if.condition, vars, false);
                const trueCode = this.getChildren(node.ifTrue, vars);
                const falseCode = this.getChildren(node.ifFalse, vars);
                result += `\${tmpl.Block((${conditionCode}) ? tmpl\`${trueCode}\` : tmpl\`${falseCode}\`)}`;
            } else if (node.value.type === "template") {
                result += `\${${this.exprToJS(node.value.template.expr, vars, false)}}`;
            } else {
                throw new Error(`Unhandled template node type: ${node.value.type}!`);
            }
        }
        else
            result = this.getChildren(node, vars);

        return result;
    }
}