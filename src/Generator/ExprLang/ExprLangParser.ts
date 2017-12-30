import { ExprLangAst as Ast } from "./ExprLangAst";
import { ExprLangLexer, Token } from "./ExprLangLexer";

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/

export const operators = ["**", "+", "-", "*", "/", "<<", ">>", ">=", "!=", "==", "<=", "<", ">", "~", "(", ")", "[", "]", ",", ".", "?", ":", "not", "!", "or", "||", "and", "&&"];

export class ExprLangParser {
    tokens: Token[];
    tokenMap = { not: '!', and: '&&', or: '||' };
    unary = ['!', '+', '-', '~'];
    binary = ['+', '-', '*', '**', '/', '<<', '>>', '>=', '!=', '==', '<=', '>', '<', '&&', '||'];
    rightAssoc = ['**']
    precedenceLevels: { name: string, operators?: string[], precedence?: number }[] = [
        { name: "assignment", operators: ['='] },
        { name: "conditional", operators: ['?'] },
        { name: "or", operators: ['||'] },
        { name: "and", operators: ['&&'] },
        { name: "comparison", operators: ['>=', '!=', '==', '<=', '>', '<'] },
        { name: "sum", operators: ['+','-'] },
        { name: "product", operators: ['*','/'] },
        { name: "exponent", operators: ['**'] },
        { name: "prefix" },
        { name: "postfix" },
        { name: "call", operators: ['('] },
        { name: "propertyAccess", operators: ['.', '['] },
    ];

    precedenceMap: { [name: string]: number } = {};

    constructor(public expression: string) {
        this.tokens = new ExprLangLexer(expression, operators).tokens;
        this.setupPrecedenceMap();
    }

    fail(message: string) {
        throw new Error(`[ExprLangParser] ${message}`);
    }

    setupPrecedenceMap() {
        for (let i = 0; i < this.precedenceLevels.length; i++) {
            const level = this.precedenceLevels[i];
            level.precedence = i + 1;
            this.precedenceMap[level.name] = level.precedence;
            if (level.operators)
                for (const op of level.operators)
                    this.precedenceMap[op] = level.precedence;
        }
    }

    consume() { 
        if (this.tokens.length === 0)
            this.fail("No more tokens are available!");
        return this.tokens.shift();
    }
    
    consumeOp(op: string) {
        const token = this.consume();
        if (token.kind !== "operator" || token.value !== op)
            this.fail(`Expected operator '${op}', got token '${token.value}' (${token.kind})`);
    }

    consumeOpIf(op: string) {
        const token = this.tokens[0];
        if (token && token.kind === "operator" && token.value === op) {
            this.consume();
            return true;
        }
        return false;
    }

    process(precedence = 0) {
        const token = this.consume();

        let left: Ast.Expression = null;
        if (token.kind === "identifier") {
            left = <Ast.IdentifierExpression> { kind: "identifier", text: token.value };
        } else if (token.kind === "string") {
            left = <Ast.LiteralExpression> { kind: "literal", type: "string", value: token.value.replace(/\\n/g, "\n") };
        } else if (token.kind === "number") {
            const value = parseInt(token.value);
            left = <Ast.LiteralExpression> { kind: "literal", type: "number", value };
        } else if (token.kind === "operator") {
            const operator = this.tokenMap[token.value] || token.value;
            if (this.unary.includes(operator)) {
                const right = this.process(this.precedenceMap["prefix"]);
                left = <Ast.UnaryExpression> { kind: "unary", op: operator, expr: right };
            } else if (operator === "(") {
                const expr = this.process();
                this.consumeOp(")");
                left = <Ast.ParenthesizedExpression> { kind: "parenthesized", expr };
            }
        }

        if (!left)
            this.fail(`Could not parse token: '${token.value}' (${token.kind})`);

        while(this.tokens.length > 0) {
            const nextToken = this.tokens[0];
            if (nextToken.kind !== "operator") break;

            const op = this.tokenMap[nextToken.value] || nextToken.value;
            const infixPrecedence = this.precedenceMap[op] || 0;
            if (infixPrecedence <= precedence) break;

            this.consume();
            if (this.binary.includes(op)) {
                const isRightAssoc = this.rightAssoc.includes(op);
                const right = this.process(isRightAssoc ? infixPrecedence - 1 : infixPrecedence);
                left = <Ast.BinaryExpression> { kind: "binary", op, left, right };
            } else if (op === "?") {
                const whenTrue = this.process();
                this.consumeOp(":");
                const whenFalse = this.process(infixPrecedence - 1);
                left = <Ast.ConditionalExpression> { kind: "conditional", condition: left, whenTrue, whenFalse };
            } else if (op === "(") {
                const args = [];

                if (!this.consumeOpIf(")")) {
                    do {
                        const arg = this.process();
                        args.push(arg);
                    } while (this.consumeOpIf(","));

                    this.consumeOp(")");
                }

                left = <Ast.CallExpression> { kind: "call", method: left, arguments: args };
            } else if (op === "[") {
                const elementExpr = this.process();
                this.consumeOp("]");
                left = <Ast.ElementAccessExpression> { kind: "elementAccess", object: left, elementExpr };
            } else if (op === ".") {
                do {
                    const prop = this.consume();
                    if (prop.kind !== "identifier")
                        this.fail(`Expected identifier as property name, got token '${prop.value}' (${prop.kind})`);
                    left = <Ast.PropertyAccessExpression> { kind: "propertyAccess", object: left, propertyName: prop.value };
                } while (this.consumeOpIf("."));
            } else {
                this.fail(`Could not parse infix operator: '${op}'`);
            }
        }

        return left;
    }

    parse() {
        const result = this.process();
        if (this.tokens.length > 0)
            this.fail("Not all tokens were consumed!");
        return result;
    }

    static parse(expression: string) {
        return new ExprLangParser(expression).process();
    }
}

