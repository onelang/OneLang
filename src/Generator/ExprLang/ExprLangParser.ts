import { ExprLangLexer, Token, TokenKind } from "./ExprLangLexer";
import { IExpression, IdentifierExpression, LiteralExpression, UnaryExpression, ParenthesizedExpression, BinaryExpression, ConditionalExpression, CallExpression, ElementAccessExpression, PropertyAccessExpression, LiteralType } from "./ExprLangAst";

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/

export class OperatorGroup {
    constructor(
        public name: string,
        public operators: string[]) { }
    precedence: number;
}

export class ExprLangParser {
    static operators = ["**", "+", "-", "*", "/", "<<", ">>", ">=", "!=", "==", "<=", "<", ">", "~", "(", ")", "[", "]", ",", ".", "?", ":", "not", "!", "or", "||", "and", "&&"];

    tokens: Token[];
    tokenMap = { not: '!', and: '&&', or: '||' };
    unary = ['!', '+', '-', '~'];
    binary = ['+', '-', '*', '**', '/', '<<', '>>', '>=', '!=', '==', '<=', '>', '<', '&&', '||'];
    rightAssoc = ['**'];
    precedenceLevels: OperatorGroup[] = [
        new OperatorGroup("assignment", ['=']),
        new OperatorGroup("conditional", ['?']),
        new OperatorGroup("or", ['||']),
        new OperatorGroup("and", ['&&']),
        new OperatorGroup("comparison", ['>=', '!=', '==', '<=', '>', '<']),
        new OperatorGroup("sum", ['+','-']),
        new OperatorGroup("product", ['*','/']),
        new OperatorGroup("exponent", ['**']),
        new OperatorGroup("prefix", null),
        new OperatorGroup("postfix", null),
        new OperatorGroup("call", ['(']),
        new OperatorGroup("propertyAccess", ['.', '['])
    ];

    precedenceMap: { [name: string]: number } = {};

    constructor(public expression: string) {
        this.tokens = new ExprLangLexer(expression, ExprLangParser.operators).tokens;
        this.setupPrecedenceMap();
    }

    fail(message: string) {
        throw new Error(`[ExprLangParser] ${message}`);
    }

    setupPrecedenceMap(): void {
        for (let i = 0; i < this.precedenceLevels.length; i++) {
            const level = this.precedenceLevels[i];
            level.precedence = i + 1;
            this.precedenceMap[level.name] = level.precedence;
            if (level.operators !== null)
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
        if (this.tokens.length === 0) return false;
        
        const token = this.tokens[0];
        if (token.kind === TokenKind.Operator && token.value === op) {
            this.consume();
            return true;
        }
        return false;
    }

    process(precedence = 0): IExpression {
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

        if (left === null)
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
                const args: IExpression[] = [];

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

    static parse(expression: string) {
        const parser = new ExprLangParser(expression);
        const result = parser.process();
        if (parser.tokens.length > 0)
            parser.fail("Not all tokens were consumed!");
        return result;
    }
}

