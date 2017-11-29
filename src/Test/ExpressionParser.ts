import { ExprLangAst as Ast } from "./ExprLangAst";
import { Tokenizer, Token, TokenizerException } from "./Tokenizer";

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/

export const operators = ["+", "-", "*", "/", "<<", ">>", "~", "(", ")", "[", "]", ",", ".", "?", ":", "not", "!", "or", "||", "and", "&&"];

export class ExpressionParser {
    tokens: Token[];
    tokenMap = { not: '!', and: '&&', or: '||' };
    unary = ['!', '+', '-', '~'];
    binary = ['+', '-', '*', '/', '<<', '>>'];
    rightAssoc = ['**']
    precedenceLevels: { name: string, operators?: string[], precedence?: number }[] = [
        { name: "assignment", operators: ['='] },
        { name: "conditional", operators: ['?'] },
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
        this.tokens = new Tokenizer(expression, operators).tokens;
        this.setupPrecedenceMap();
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

    consume() { return this.tokens.shift(); }
    
    consumeOp(op: string) {
        const token = this.consume();
        if (token.kind !== "operator" || token.value !== op)
            throw new Error(`Expected operator '${op}', got token '${token.value}' (${token.kind})`);
    }

    consumeOpIf(op: string) {
        const token = this.tokens[0];
        if (token && token.kind === "operator" && token.value === op) {
            this.consume();
            return true;
        }
        return false;
    }

    parse(precedence = 0) {
        const token = this.consume();

        let left: Ast.Expression = null;
        if (token.kind === "identifier") {
            left = <Ast.IdentifierExpression> { kind: "identifier", text: token.value };
        } else if (token.kind === "string") {
            left = <Ast.LiteralExpression> { kind: "literal", type: "string", value: token.value };
        } else if (token.kind === "number") {
            const value = parseInt(token.value);
            left = <Ast.LiteralExpression> { kind: "literal", type: "number", value };
        } else if (token.kind === "operator") {
            const operator = this.tokenMap[token.value] || token.value;
            if (this.unary.includes(operator)) {
                const right = this.parse(this.precedenceMap["prefix"]);
                left = <Ast.UnaryExpression> { kind: "unary", op: operator, expr: right };
            } else if (operator === "(") {
                const expr = this.parse();
                this.consumeOp(")");
                left = <Ast.ParenthesizedExpression> { kind: "parenthesized", expr };
            }
        }

        if (!left)
            throw new Error(`Could not parse token: '${token.value}' (${token.kind})`);

        while(this.tokens.length > 0) {
            const nextToken = this.tokens[0];
            if (nextToken.kind !== "operator") break;

            const op = nextToken.value;
            const infixPrecedence = this.precedenceMap[op] || 0;
            if (infixPrecedence <= precedence) break;

            this.consume();
            if (this.binary.includes(op)) {
                const isRightAssoc = this.rightAssoc.includes(op);
                const right = this.parse(isRightAssoc ? infixPrecedence - 1 : infixPrecedence);
                left = <Ast.BinaryExpression> { kind: "binary", op, left, right };
            } else if (op === "?") {
                const whenTrue = this.parse();
                this.consumeOp(":");
                const whenFalse = this.parse(infixPrecedence - 1);
                left = <Ast.ConditionalExpression> { kind: "conditional", condition: left, whenTrue, whenFalse };
            } else if (op === "(") {
                const args = [];

                if (!this.consumeOpIf(")")) {
                    do {
                        const arg = this.parse();
                        args.push(arg);
                    } while (this.consumeOpIf(","));

                    this.consumeOp(")");
                }

                left = <Ast.CallExpression> { kind: "call", method: left, arguments: args };
            } else if (op === "[") {
                const elementExpr = this.parse();
                this.consumeOp("]");
                left = <Ast.ElementAccessExpression> { kind: "elementAccess", object: left, elementExpr };
            } else if (op === ".") {
                do {
                    const prop = this.consume();
                    if (prop.kind !== "identifier")
                        throw new Error(`Expected identifier as property name, got token '${prop.value}' (${prop.kind})`);
                    left = <Ast.PropertyAccessExpression> { kind: "propertyAccess", object: left, propertyName: prop.value };
                } while (this.consumeOpIf("."));
            } else {
                throw new Error(`Could not parse infix operator: '${op}'`);
            }
        }

        return left;
    }
}

