import { AstNode, AstNodeType, OperatorWithOperand } from "./ExpressionLanguage/Parser";
import { ExpressionParser } from "./ExpressionLanguage/ExpressionParser";

class TemplateNode {
    children: TemplateNode[] = [];

    constructor(public value: TemplatePart, public parent: TemplateNode) { }

    repr(): string {
        let result = this.value ? this.value.repr() + "\n" : "";
        for (const item of this.children)
            result += item.repr().split("\n").map((x,i) => (i === 0 ? "- ": "  ") + x).join("\n") + "\n";
        result = result.substring(0, result.length - 1);
        return result;
    }
}

class TemplatePart {
    type: "text"|"template"|"for"|"if"|"closeNode";

    textValue: string;
    for: { itemName: string, array: AstNode };
    if: { condition: AstNode };
    closeNode: { tag: "for"|"if" };
    template: { expr: AstNode };

    constructor(public value: string, isText: boolean) {
        let match;
        if(isText) {
            this.type = "text";
            this.textValue = value;
        }
        else if (match = /^for ([a-zA-Z]+) in (.*)/.exec(value)) {
            this.type = "for";
            this.for = { itemName: match[1], array: ExpressionParser.parse(match[2]) };
        } else if (match = /^if (.*)/.exec(value)) {
            this.type = "if";
            this.if = { condition: ExpressionParser.parse(match[1]) };
        } else if (match = /^\/(for|if)/.exec(value)) {
            this.type = "closeNode";
            this.closeNode = { tag: <"for"|"if">match[1] };
        } else {
            this.type = "template";
            const paramsOffs = value.lastIndexOf("|");
            const expr = paramsOffs === -1 ? value : value.substr(0, paramsOffs);
            const params = paramsOffs === -1 ? "" : value.substr(paramsOffs + 1);
            this.template = { expr: ExpressionParser.parse(expr) };
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
    }

    convertIdentifier(name: string, vars: string[], type: "variable"|"field"|"declaration") { return name; }

    generateTree() {
        const parts = this.template.split(/\{\{(.*?)\}\}/).map((x,i) => new TemplatePart(x, i % 2 === 0));
        const root = new TemplateNode(null, null);

        let current = root;
        for (let part of parts) {
            //console.log(part.type, part.for || part.if || part.template || part.closeNode);
            if (part.type === "closeNode") {
                if (current.value.type !== part.closeNode.tag)
                    throw new Error(`Invalid close tag! Expected ${current.value.type}, got ${part.closeNode.tag}!`);

                current = current.parent;
            } else {
                const newNode = new TemplateNode(part, current);
                current.children.push(newNode);
                if (part.type === "for" || part.type === "if")
                    current = newNode;
            }
        }
        return root;
    }

    escapeJsString(str: string) {
        // TODO replace others
        const charsToQuote = ["'", "\"", "\\n", "\\r", "\\t", "\\v"];
        return charsToQuote.reduce((prev, char) => prev.replace(new RegExp(char, "g"), "\\" + char), str);
    }

    exprToJS(ast: AstNode, vars: string[], isMember: boolean): string {
        if (ast.type === AstNodeType.Identifier) {
            if (/\d+/.exec(ast.identifier))
                return ast.identifier;
            else
                return this.convertIdentifier(ast.identifier, vars, isMember ? "field" : "variable");
        } else if (ast.type === AstNodeType.OperatorList)
            return ast.operands.reduce((prev, curr) =>
                `${prev}${curr.operator ? curr.operator.text : ""}${this.exprToJS(curr.operand, vars, curr.operator && curr.operator.text === ".")}` , "");
        else if (ast.type === AstNodeType.Function)
            return `${this.exprToJS(ast.function, vars, false)}(${ast.arguments.map(arg => this.exprToJS(arg, vars, false)).join(", ")})`;
        else
            throw new Error(`Unhandled AST type: ${ast.type}!`);
    }

    templateToJS(node: TemplateNode, vars: string[], padding = "") {
        let result = padding;

        const getChildren = (newVars: string[] = []) => {
            return node.children && node.children.length > 0 ?
                node.children.map(x => this.templateToJS(x, vars.concat(newVars))).join("") : "";
        };

        if (node.value) {
            if (node.value.type === "text") {
                result += node.value.textValue;
            } else if (node.value.type === "for") {
                const varName = this.convertIdentifier(node.value.for.itemName, vars, "declaration");
                result += `\${(${this.exprToJS(node.value.for.array, vars, false)}||[]).map(${varName} => \`${getChildren([varName])}\`).join("")}`;
            } else if (node.value.type === "if") {
                result += `\${${this.exprToJS(node.value.if.condition, vars, false)} ? \`${getChildren()}\` : ""}`;
            } else if (node.value.type === "template") {
                result += `\${${this.exprToJS(node.value.template.expr, vars, false)}}`;
            } else {
                throw new Error(`Unhandled template node type: ${node.value.type}!`);
            }
        }
        else
            result = getChildren();

        return result;
    }

    getGeneratorFunction() {
        const jsCode = `
            (function (${this.args.map(arg => `${arg}`).join(", ")}) {
                return \`${this.templateToJS(this.treeRoot, this.args)}\`;
            })`;
        return eval(jsCode);
    }
}