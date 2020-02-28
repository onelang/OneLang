import { ExprLangLexer, Token, TokenKind } from "./ExprLangLexer";
import { IExpression, IdentifierExpression, LiteralExpression, UnaryExpression, ParenthesizedExpression, BinaryExpression, ConditionalExpression, CallExpression, ElementAccessExpression, PropertyAccessExpression, LiteralType } from "./ExprLangAst";

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
        if (token.kind !== TokenKind.Operator || token.value !== op)
            this.fail(`Expected operator '${op}', got token '${token.value}' (${token.kind})`);
    }

    consumeOpIf(op: string) {
        const token = this.tokens[0];
        if (token && token.kind === TokenKind.Operator && token.value === op) {
            this.consume();
            return true;
        }
        return false;
    }

    process(precedence = 0) {
        const token = this.consume();

        let left: IExpression = null;
        if (token.kind === TokenKind.Identifier) {
            left = new IdentifierExpression(token.value);
        } else if (token.kind === TokenKind.String) {
            left = new LiteralExpression(LiteralType.String, token.value.replace(/\\n/g, "\n"));
        } else if (token.kind === TokenKind.Number) {
            const value = parseInt(token.value);
            left = new LiteralExpression(LiteralType.Number, value);
        } else if (token.kind === TokenKind.Operator) {
            const operator = this.tokenMap[token.value] || token.value;
            if (this.unary.includes(operator)) {
                const right = this.process(this.precedenceMap["prefix"]);
                left = new UnaryExpression(operator, right);
            } else if (operator === "(") {
                const expr = this.process();
                this.consumeOp(")");
                left = new ParenthesizedExpression(expr);
            }
        }

        if (!left)
            this.fail(`Could not parse token: '${token.value}' (${token.kind})`);

        while(this.tokens.length > 0) {
            const nextToken = this.tokens[0];
            if (nextToken.kind !== TokenKind.Operator) break;

            const op = this.tokenMap[nextToken.value] || nextToken.value;
            const infixPrecedence = this.precedenceMap[op] || 0;
            if (infixPrecedence <= precedence) break;

            this.consume();
            if (this.binary.includes(op)) {
                const isRightAssoc = this.rightAssoc.includes(op);
                const right = this.process(isRightAssoc ? infixPrecedence - 1 : infixPrecedence);
                left = new BinaryExpression(op, left, right);
            } else if (op === "?") {
                const whenTrue = this.process();
                this.consumeOp(":");
                const whenFalse = this.process(infixPrecedence - 1);
                left = new ConditionalExpression(left, whenTrue, whenFalse);
            } else if (op === "(") {
                const args = [];

                if (!this.consumeOpIf(")")) {
                    do {
                        const arg = this.process();
                        args.push(arg);
                    } while (this.consumeOpIf(","));

                    this.consumeOp(")");
                }

                left = new CallExpression(left, args);
            } else if (op === "[") {
                const elementExpr = this.process();
                this.consumeOp("]");
                left = new ElementAccessExpression(left, elementExpr);
            } else if (op === ".") {
                do {
                    const prop = this.consume();
                    if (prop.kind !== TokenKind.Identifier)
                        this.fail(`Expected identifier as property name, got token '${prop.value}' (${prop.kind})`);
                    left = new PropertyAccessExpression(left, prop.value);
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

