import { Reader } from "./Reader";
import { NodeManager } from "./NodeManager";
import { UnresolvedType } from "../../One/Ast/AstTypes";
import { Expression, MapLiteral, ArrayLiteral, UnaryType, Identifier, NumericLiteral, StringLiteral, UnresolvedCallExpression, CastExpression, BinaryExpression, UnaryExpression, ParenthesizedExpression, ConditionalExpression, ElementAccessExpression, PropertyAccessExpression } from "../../One/Ast/Expressions";

class Operator {
    constructor(public text: string, public precedence: number, public isBinary: boolean, public isRightAssoc: boolean, public isPostfix: boolean) { }
}

export class PrecedenceLevel { 
    constructor(public name: string, public operators: string[], public binary: boolean) { }
}

export class ExpressionParserConfig {
    unary: string[];
    precedenceLevels: PrecedenceLevel[];
    rightAssoc: string[];
    aliases: { [alias: string]: string };
    propertyAccessOps: string[];
}

export class ExpressionParser {
    static defaultConfig() {
        const config = new ExpressionParserConfig();
        config.unary = ['!', 'not', '+', '-', '~'];
        config.precedenceLevels = [
            new PrecedenceLevel("assignment", ['=', '+=', '-=', '*=', '/=', '<<=', '>>='], true),
            new PrecedenceLevel("conditional", ['?'], false),
            new PrecedenceLevel("or", ['||', 'or'], true),
            new PrecedenceLevel("and", ['&&', 'and'], true),
            new PrecedenceLevel("comparison", ['>=', '!=', '===', '!==', '==', '<=', '>', '<'], true),
            new PrecedenceLevel("sum", ['+','-'], true),
            new PrecedenceLevel("product", ['*','/','%'], true),
            new PrecedenceLevel("bitwise", ['|','&','^'], true),
            new PrecedenceLevel("exponent", ['**'], true),
            new PrecedenceLevel("shift", ['<<', '>>'], true),
            new PrecedenceLevel("range", ['...'], true), // TODO: move to lang
            new PrecedenceLevel("in", ['in'], true), // TODO: move to lang
            new PrecedenceLevel("prefix", [], false),
            new PrecedenceLevel("postfix", ['++', '--'], false),
            new PrecedenceLevel("call", ['('], false),
            new PrecedenceLevel("propertyAccess", [], false),
            new PrecedenceLevel("elementAccess", ['['], false)
        ];
        config.rightAssoc = ['**'];
        config.aliases = { "===": "==", "!==": "!=", "not": "!", "and": "&&", "or": "||" };
        config.propertyAccessOps = [".", "::"];
        return config;
    }

    operatorMap: { [name: string]: Operator };
    operators: string[];
    prefixPrecedence: number;

    unaryPrehook: () => Expression = null;
    infixPrehook: (left: Expression) => Expression = null;

    constructor(public reader: Reader, public nodeManager: NodeManager = null, public config: ExpressionParserConfig = ExpressionParser.defaultConfig()) {
        this.reconfigure();
    }

    reconfigure() {
        this.config.precedenceLevels.find(x => x.name === "propertyAccess").operators = this.config.propertyAccessOps;

        this.operatorMap = {};

        for (let i = 0; i < this.config.precedenceLevels.length; i++) {
            const level = this.config.precedenceLevels[i];
            const precedence = i + 1;
            if (level.name === "prefix")
                this.prefixPrecedence = precedence;
            
            if (!level.operators) continue;

            for (const opText of level.operators) {
                const op = new Operator(opText, precedence, level.binary, 
                    this.config.rightAssoc.includes(opText), level.name == "postfix");

                this.operatorMap[opText] = op;
            }
        }

        this.operators = Object.keys(this.operatorMap).sort((a,b) => b.length - a.length);
    }

    parseMapLiteral(keySeparator = ":", startToken = "{", endToken = "}") {
        if (!this.reader.readToken(startToken)) return null;

        const items = new Map<string, Expression>();
        do {
            if (this.reader.peekToken(endToken)) break;

            let name = this.reader.readString();
            if (name === null)
                name = this.reader.expectIdentifier("expected string or identifier as map key");

            this.reader.expectToken(keySeparator);
            const initializer = this.parse();
            items.set(name, initializer);
        } while(this.reader.readToken(","));

        this.reader.expectToken(endToken);
        return new MapLiteral(items);
    }

    parseArrayLiteral(startToken = "[", endToken = "]") {
        if (!this.reader.readToken(startToken)) return null;
        
        const items: Expression[] = [];
        if (!this.reader.readToken(endToken)) {
            do {
                const item = this.parse();
                items.push(item);
            } while(this.reader.readToken(","));

            this.reader.expectToken(endToken);
        }
        return new ArrayLiteral(items);
    }

    parseLeft(required = true): Expression {
        const result = this.unaryPrehook && this.unaryPrehook();
        if (result !== null) return result;

        const unary = this.reader.readAnyOf(this.config.unary);
        if (unary !== null) {
            const right = this.parse(this.prefixPrecedence);
            return new UnaryExpression(UnaryType.Prefix, unary, right);
        }

        const id = this.reader.readIdentifier();
        if (id !== null)
            return new Identifier(id);

        const num = this.reader.readNumber();
        if (num !== null)
            return new NumericLiteral(num);

        const str = this.reader.readString();
        if (str !== null)
            return new StringLiteral(str);

        if (this.reader.readToken("(")) {
            const expr = this.parse();
            this.reader.expectToken(")");
            return new ParenthesizedExpression(expr);
        }

        if (required)
            this.reader.fail(`unknown (literal / unary) token in expression`);
        else 
            return null;
    }

    parseOperator() {
        let op: Operator = null;
        for (const opText of this.operators)
            if (this.reader.peekToken(opText))
                return this.operatorMap[opText];

        return null;
    }

    parseCallArguments() {
        const args: Expression[] = [];

        if (!this.reader.readToken(")")) {
            do {
                const arg = this.parse();
                args.push(arg);
            } while (this.reader.readToken(","));

            this.reader.expectToken(")");
        }

        return args;
    }

    addNode(node: any, start: number) {
        if (this.nodeManager !== null)
            this.nodeManager.addNode(node, start);
    }

    parse(precedence = 0, required = true): Expression {
        this.reader.skipWhitespace();
        const leftStart = this.reader.offset;
        let left = this.parseLeft(required);
        if (!left) return null;
        this.addNode(left, leftStart);

        while(true) {
            if (this.infixPrehook) {
                const parsed = this.infixPrehook(left);
                if (parsed) {
                    left = parsed;
                    this.addNode(left, leftStart);
                    continue;
                }
            }

            const op = this.parseOperator();
            if (op === null || op.precedence <= precedence) break;
            this.reader.expectToken(op.text);
            const opText = op.text in this.config.aliases ? this.config.aliases[op.text] : op.text;

            if (op.isBinary) {
                const right = this.parse(op.isRightAssoc ? op.precedence - 1 : op.precedence);
                left = new BinaryExpression(left, opText, right);
            } else if (op.isPostfix) {
                left = new UnaryExpression(UnaryType.Postfix, opText, left);
            } else if (op.text === "?") {
                const whenTrue = this.parse();
                this.reader.expectToken(":");
                const whenFalse = this.parse(op.precedence - 1);
                left = new ConditionalExpression(left, whenTrue, whenFalse);
            } else if (op.text === "(") {
                const args = this.parseCallArguments();
                left = new UnresolvedCallExpression(left, [], args);
            } else if (op.text === "[") {
                const elementExpr = this.parse();
                this.reader.expectToken("]");
                left = new ElementAccessExpression(left, elementExpr);
            } else if (this.config.propertyAccessOps.includes(op.text)) {
                const prop = this.reader.expectIdentifier("expected identifier as property name");
                left = new PropertyAccessExpression(left, prop);
            } else {
                this.reader.fail(`parsing '${op.text}' is not yet implemented`);
            }

            this.addNode(left, leftStart);
        }

        if (left instanceof ParenthesizedExpression && left.expression instanceof Identifier) {
            const expr = this.parse(0, false);
            if (expr !== null)
                return new CastExpression(new UnresolvedType(left.expression.text), expr);
        }

        return left;
    }
}
