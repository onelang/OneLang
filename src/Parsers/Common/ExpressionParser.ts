import { OneAst as ast } from "../../One/Ast";
import { Reader } from "./Reader";

class Operator {
    constructor(public text: string, public precedence: number, public isBinary: boolean, public isRightAssoc: boolean, public aliases: string[] = []) { }
}

export interface ExpressionParserConfig {
    unary: string[];
    precedenceLevels: { name: string, operators?: string[], binary?: boolean }[];
    rightAssoc: string[];
    aliases: { [opName: string]: string[] };
}

export class ExpressionParser {
    static defaultConfig = <ExpressionParserConfig> {
        unary: ['!', '+', '-', '~'],
        precedenceLevels: [
            { name: "assignment", operators: ['='] },
            { name: "conditional", operators: ['?'] },
            { name: "or", operators: ['||'], binary: true },
            { name: "and", operators: ['&&'], binary: true },
            { name: "comparison", operators: ['>=', '!=', '==', '<=', '>', '<'], binary: true },
            { name: "sum", operators: ['+','-'], binary: true },
            { name: "product", operators: ['*','/'], binary: true },
            { name: "exponent", operators: ['**'], binary: true },
            { name: "prefix" },
            { name: "postfix" },
            { name: "call", operators: ['('] },
            { name: "propertyAccess", operators: ['.', '['] },
        ],
        rightAssoc: ['**'],
        aliases: { '!': ["not"], '&&': ["and"], '||': ["or"] },
    };

    operatorMap: { [name: string]: Operator } = {};
    prefixPrecedence: number;

    constructor(public reader: Reader, public config: ExpressionParserConfig = ExpressionParser.defaultConfig) {
        this.reconfigure();
    }

    reconfigure() {
        for (let i = 0; i < this.config.precedenceLevels.length; i++) {
            const level = this.config.precedenceLevels[i];
            const precedence = i + 1;
            if (level.name === "prefix")
                this.prefixPrecedence = precedence;
            
            if (!level.operators) continue;

            for (const opText of level.operators) {
                const op = new Operator(opText, precedence, level.binary, 
                    this.config.rightAssoc.includes(opText), this.config.aliases[opText] || []);

                this.operatorMap[opText] = op;
                for (const alias of op.aliases)
                    this.operatorMap[alias] = op;
            }
        }
    }

    parseLeft(): ast.Expression {
        const id = this.reader.readIdentifier();
        if (id !== "") {
            if (this.operatorMap[id]) return null;
            return <ast.Identifier> { exprKind: "Identifier", text: id };
        }

        const num = this.reader.readNumber();
        if (num !== "")
            return <ast.Literal> { exprKind: "Literal", literalType: "numeric", value: num };

        const str = this.reader.readString();
        if (str !== "")
            return <ast.Literal> { exprKind: "Literal", literalType: "string", value: str };

        const unary = this.reader.readAnyOf(this.config.unary);
        if (unary !== "") {
            const right = this.parse(this.prefixPrecedence);
            return <ast.UnaryExpression> { exprKind: "Unary", unaryType: "prefix", operator: unary, operand: right };
        }

        if (this.reader.readToken("(")) {
            const expr = this.parse();
            this.reader.expectToken(")");
            return <ast.ParenthesizedExpression> { exprKind: "Parenthesized", expression: expr };
        }

        if (this.reader.readToken("{")) {
            const mapLiteral = <ast.MapLiteral> { exprKind: "MapLiteral", properties: [] };
            if (!this.reader.readToken("}")) {
                do {
                    const item = <ast.VariableDeclaration> { };
                    mapLiteral.properties.push(item);

                    item.name = this.reader.expectIdentifier("expected identifier as map key");
                    this.reader.expectToken(":");
                    item.initializer = this.parse();
                } while(this.reader.readToken(","));

                this.reader.expectToken("}");
            }
            return mapLiteral;
        }

        this.reader.fail(`unknown (literal / unary) token in expression`);
    }

    parseOperator() {
        let op: Operator = null;
        for (const opText of Object.keys(this.operatorMap))
            if (this.reader.readToken(opText))
                return this.operatorMap[opText];

        return null;
    }

    parse(precedence = 0): ast.Expression {
        let left = this.parseLeft();

        while(true) {
            const op = this.parseOperator();
            if (op === null || op.precedence <= precedence) break;

            if (op.isBinary) {
                const right = this.parse(op.isRightAssoc ? op.precedence - 1 : op.precedence);
                left = <ast.BinaryExpression> { exprKind: "Binary", operator: op.text, left, right };
            } else if (op.text === "?") {
                const whenTrue = this.parse();
                this.reader.expectToken(":");
                const whenFalse = this.parse(op.precedence - 1);
                left = <ast.ConditionalExpression> { exprKind: "Conditional", condition: left, whenTrue, whenFalse };
            } else if (op.text === "(") {
                const args = [];

                if (!this.reader.readToken(")")) {
                    do {
                        const arg = this.parse();
                        args.push(arg);
                    } while (this.reader.readToken(","));

                    this.reader.expectToken(")");
                }

                left = <ast.CallExpression> { exprKind: "Call", method: left, arguments: args };
            } else if (op.text === "[") {
                const elementExpr = this.parse();
                this.reader.expectToken("]");
                left = <ast.ElementAccessExpression> { exprKind: "ElementAccess", object: left, elementExpr };
            } else if (op.text === ".") {
                do {
                    const prop = this.reader.expectIdentifier("expected identifier as property name");
                    left = <ast.PropertyAccessExpression> { exprKind: "PropertyAccess", object: left, propertyName: prop };
                } while (this.reader.readToken("."));
            } else {
                this.reader.fail(`parsing '${op.text}' is not yet implemented`);
            }
        }

        return left;
    }
}
