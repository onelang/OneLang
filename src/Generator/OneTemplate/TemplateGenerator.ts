import * as ExprAst from "../ExprLang/ExprLangAst";
import { ExprLangParser } from "../ExprLang/ExprLangParser";
import { ExprLangVM, IModelHandler, VariableContext, VariableSource, JSModelHandler } from "../ExprLang/ExprLangVM";
import * as Ast from "./TemplateAst";
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
        this.body = TemplateParser.parse(template.replace(/\\#/g, "#"));
    }

    static fromSignature(signature: string, template: string) {
        const expr = ExprLangParser.parse(signature);
        if (expr instanceof ExprAst.CallExpression) {
            const name = (<ExprAst.IdentifierExpression> expr.method).text;
            const args = expr.args.map(x => (<ExprAst.IdentifierExpression> x).text);
            return new TemplateMethod(name, args, template);
        } else if (expr instanceof ExprAst.IdentifierExpression) {
            const name = expr.text;
            return new TemplateMethod(name, [], template);
        } else {
            throw new Error(`Could not parse method signature: '${signature}'`);
        }
    }
}

export class CallStackItem {
    constructor(public methodName: string, public vars: VariableContext) { }
}

export class GeneratedNode {
    astNode: any;
    constructor(public text: string) { }
}

export class TemplateGenerator implements IModelHandler {
    vm = new ExprLangVM(this);
    rootVars: VariableContext;
    methods = new VariableSource("TemplateGenerator methods");
    callStack: CallStackItem[] = [];
    objectHook: (obj: object) => GeneratedNode[] = null;

    constructor(variables: VariableContext) {
        this.rootVars = variables.inherit(this.methods);
    }

    addMethod(method: TemplateMethod) {
        this.methods.addCallback(method.name, () => method);
    }

    methodCall(method: any, args: any[], thisObj: any, vars: VariableContext): GeneratedNode[] {
        let result: GeneratedNode[];
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
            throw new Error(`Expected TemplateMethod or function, but got '${method}' (typeof ${typeof method})`);
        }

        this.callStack.pop();
        return result;
    }

    memberAccess(obj: object, memberName: string | number, isProperty: boolean) {
        return JSModelHandler.memberAccess(obj, memberName, isProperty);
    }

    isSimpleTextNode(node: Ast.BlockItem) {
        return node instanceof Ast.Line && node.items[0] instanceof Ast.TextNode;
    }

    static join(items: GeneratedNode[], separator: string) {
        const result: GeneratedNode[] = [];
        for (const item of items) {
            if (result.length !== 0)
                result.push(new GeneratedNode(separator));
            result.push(item);
        }
        return result;
    }

    static joinLines(lines: GeneratedNode[][], separator: string) {
        const result: GeneratedNode[] = [];
        for (const line of lines) {
            if (result.length !== 0)
                result.push(new GeneratedNode(separator));
            result.push(...line);
        }
        return result;
    }

    processBlockNode(node: Ast.Block, vars: VariableContext): GeneratedNode[] {
        const lines = node.lines.map(x => this.generateNode(x, vars));
        const removeWs = lines.map(x => x === null);
        const resultLines: GeneratedNode[][] = [];
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
        const result = resultLines.length > 0 ? TemplateGenerator.joinLines(resultLines, "\n") : null;
        return result;
    }

    processLineNode(node: Ast.Line, vars: VariableContext): GeneratedNode[] {
        const lines = node.items.map(x => this.generateNode(x, vars));
        const nonNullLines = lines.filter(x => x !== null);
        
        if (lines.length === 0) {
            return [new GeneratedNode("")];
        } else if (nonNullLines.length === 0) {
            return null;
        } else {
            const hasIndent = node.indentLen > 0;
            const indent = hasIndent ? new GeneratedNode(" ".repeat(node.indentLen)) : null;
            
            let result: GeneratedNode[] = [];
            if (hasIndent)
                result.push(indent);

            for (const line of nonNullLines) {
                if (hasIndent) {
                    for (const item of line) {
                        const parts = item.text.toString().split(/\n/g);
                        if (parts.length === 1) {
                            result.push(item);
                        } else {
                            result.push(new GeneratedNode(parts[0]), new GeneratedNode("\n"));
                            result.push(...TemplateGenerator.joinLines(parts.slice(1).map(x => [indent, new GeneratedNode(x)]), "\n"));
                        }
                    }
                } else {
                    result.push(...line);
                }
            }
            return result;
        }
    }

    processIfNode(node: Ast.IfNode, vars: VariableContext): GeneratedNode[] {
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

    processForNode(node: Ast.ForNode, vars: VariableContext): GeneratedNode[] {
        let result: GeneratedNode[];

        const array = <any[]> this.vm.evaluate(node.arrayExpr, vars);
        if (array.length === 0) {
            result = node.else ? this.generateNode(node.else, vars) : null;
        } else {
            const lines: GeneratedNode[][] = [];

            const varSource = new VariableSource(`for: ${node.itemName}`)
            const newVars = vars.inherit(varSource);

            for (let itemIdx = 0; itemIdx < array.length; itemIdx++) {
                varSource.setVariable(node.itemName, array[itemIdx], true);
                varSource.setVariable(`${node.itemName}_idx`, itemIdx, true);
                const line = this.generateNode(node.body, newVars);
                if (line !== null)
                    lines.push(line);
            }
            
            result = lines.length === 0 ? null : TemplateGenerator.joinLines(lines, node.separator);
        }

        return result;
    }

    processTemplateNode(node: Ast.TemplateNode, vars: VariableContext): GeneratedNode[] {
        const result = this.vm.evaluate(node.expr, vars);
        if (result === null) {
            return null;
        } else if (Array.isArray(result)) {
            return <GeneratedNode[]> result;
        } else if (typeof result === "object" && this.objectHook) {
            return this.objectHook(result);
        } else {
            return [new GeneratedNode(result.toString())];
        }
    }

    generateNode(node: Ast.Node, vars: VariableContext): GeneratedNode[] {
        let result: GeneratedNode[];

        if (node instanceof Ast.TextNode) {
            result = [new GeneratedNode(node.value)];
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

    generate(template: Ast.Node): string {
        const nodes = this.generateNode(template, this.rootVars);
        const result = nodes.map(x => x.text).join("");
        return result;
    }
}
