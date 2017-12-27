import { ExprLangAst as ExprAst } from "../ExprLang/ExprLangAst";
import { ExprLangParser } from "../ExprLang/ExprLangParser";
import { ExprLangVM, IMethodHandler, VariableContext, VariableSource } from "../ExprLang/ExprLangVM";
import { TemplateAst as Ast } from "./TemplateAst";
import { TemplateParser } from "./TemplateParser";

/**
 * Some important notes:
 *  - nodes DON'T include trailing '\n', it's only added when they are included into somewhere else
 *  - the AST usually contains all the newline ('\n') characters, except for "for" and "if" constructs,
 *    because those are not always generate _any_ result (not even a newline), eg:
 *      - for: no items and {{else}} is not specified
 *      - if: condition is not true and {{else}} is not specified
 *    so we have to add that '\n' here in the generator based on runtime data 
 *    (but only if it's not an inline construct & it's not the last node -> no trailing '\n' is allowed)
 *  - empty string ("") and <null> are different: <null> is created when an if or for does not match any item
 *    <null> does not generate code, not counts as a valid item in for (so no separator included)
 *    empty string ("") can generate code (eg. new line, separator in for loop, etc)
 */

export class TemplateMethod {
    body: Ast.Block;

    constructor(public name: string, public args: string[], public template: string) {
        this.body = TemplateParser.parse(template);
    }

    static fromSignature(signature: string, template: string) {
        const signatureAst = ExprLangParser.parse(signature);        
        if (signatureAst.kind === "call") {
            const callExpr = <ExprAst.CallExpression> signatureAst;
            const name = (<ExprAst.IdentifierExpression> callExpr.method).text;
            const args = callExpr.arguments.map(x => (<ExprAst.IdentifierExpression> x).text);
            return new TemplateMethod(name, args, template);
        } else if (signatureAst.kind === "identifier") {
            const idExpr = <ExprAst.IdentifierExpression> signatureAst;
            const name = idExpr.text;
            return new TemplateMethod(name, [], template);
        } else {
            throw new Error(`Could not parse method signature: '${signature}'`);
        }
    }
}

export class CallStackItem {
    constructor(public methodName: string, public vars: VariableContext) { }
}

export class TemplateGenerator implements IMethodHandler {
    vm = new ExprLangVM();
    rootVars: VariableContext;
    methods = new VariableSource("TemplateGenerator methods");
    callStack: CallStackItem[] = [];

    constructor(variables: VariableContext) {
        this.vm.methodHandler = this;
        this.rootVars = variables.inherit(this.methods);
    }

    addMethod(method: TemplateMethod) {
        this.methods.addCallback(method.name, () => method);
    }

    call(method: any, args: any[], thisObj: any, vars: VariableContext) {
        let result;
        this.callStack.push(new CallStackItem(<string> method.name, vars));
        
        if (method instanceof TemplateMethod) {
            //if (args.length !== method.args.length)
            //    throw new Error(`Method '${method.name}' called with ${args.length} arguments, but expected ${method.args.length}`);
            
            const varSource = new VariableSource(`method: ${method.name}`);
            for (let i = 0; i < args.length; i++)
                varSource.setVariable(method.args[i], args[i]);

            result = this.generateNode(method.body, vars.inherit(varSource));
        } else if (typeof method === "function") {
            result = method.apply(thisObj, args);
        } else {
            throw new Error(`Expected TemplateMethod or function, but got ${method}`);
        }

        this.callStack.pop();
        return result;
    }

    isSimpleTextNode(node: Ast.BlockItem) {
        return node instanceof Ast.Line && node.items[0] instanceof Ast.TextNode;
    }

    processBlockNode(node: Ast.Block, vars: VariableContext) {
        const lines = node.lines.map(x => this.generateNode(x, vars));
        const removeWs = lines.map(x => x === null);
        const resultLines = [];
        for (let iLine = 0; iLine < lines.length; iLine++) {
            const line = lines[iLine];
            if (line === null) continue;

            const origLine = node.lines[iLine];
            const origLineWs = origLine instanceof Ast.Line && origLine.items.length === 0;

            if (origLineWs) {
                if (removeWs[iLine - 1]) {
                    removeWs[iLine - 1] = false;
                    continue;
                }

                if (removeWs[iLine + 1]) {
                    removeWs[iLine + 1] = false;
                    continue;
                }
            }

            resultLines.push(line);
        }
        const result = resultLines.length > 0 ? resultLines.join("\n") : null;
        return result;
    }

    processLineNode(node: Ast.Line, vars: VariableContext) {
        const lines = node.items.map(x => this.generateNode(x, vars));
        const nonNullLines = lines.filter(x => x !== null);
        let result = lines.length === 0 ? "" : nonNullLines.length > 0 ? nonNullLines.join("") : null;
        if (result !== null && node.indentLen > 0) {
            const indent = " ".repeat(node.indentLen);
            result = indent + result.replace(/\n/g, "\n" + indent);
        }
        return result;
    }

    processIfNode(node: Ast.IfNode, vars: VariableContext) {
        let resultBlock = node.else;

        for (const item of node.items)
        {
            const condValue = this.vm.evaluate(item.condition, vars);
            if (condValue) {
                resultBlock = item.body;
                break;
            }
        }

        const result = resultBlock ? this.generateNode(resultBlock, vars) : null;
        return result;
    }

    processForNode(node: Ast.ForNode, vars: VariableContext) {
        let result: string;

        const array = <any[]> this.vm.evaluate(node.arrayExpr, vars);
        if (array.length === 0) {
            result = node.else ? this.generateNode(node.else, vars) : null;
        } else {
            const lines = [];

            const varSource = new VariableSource(`for: ${node.itemName}`)
            const newVars = vars.inherit(varSource);

            for (let itemIdx = 0; itemIdx < array.length; itemIdx++) {
                varSource.setVariable(node.itemName, array[itemIdx], true);
                varSource.setVariable(`${node.itemName}_idx`, itemIdx, true);
                const line = this.generateNode(node.body, newVars);
                if (line !== null)
                    lines.push(line);
            }
            
            result = lines.length === 0 ? null : lines.join(node.separator);
        }

        return result;
    }

    processTemplateNode(node: Ast.TemplateNode, vars: VariableContext) {
        const result = this.vm.evaluate(node.expr, vars);
        return result;
    }

    generateNode(node: Ast.Node, vars: VariableContext) {
        let result: string;

        if (node instanceof Ast.TextNode) {
            result = node.value;
        } else if (node instanceof Ast.TemplateNode) {
            result = this.processTemplateNode(node, vars);
        } else if (node instanceof Ast.Block) {
            result = this.processBlockNode(node, vars);
        } else if (node instanceof Ast.Line) {
            result = this.processLineNode(node, vars);
        } else if (node instanceof Ast.IfNode) {
            result = this.processIfNode(node, vars);
        } else if (node instanceof Ast.ForNode) {
            result = this.processForNode(node, vars);
        } else {
            throw new Error("Unexpected node type");
        }

        return result;
    }

    generate(template: Ast.Node) {
        const result = this.generateNode(template, this.rootVars);
        return result;
    }
}
