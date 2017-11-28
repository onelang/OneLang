export namespace ExprLangAst {
    export interface Expression {
        kind: "binary"|"unary"|"literal"|"identifier";
    }
    
    export interface BinaryExpression extends Expression {
        kind: "binary";
        op: "+";
        left: Expression;
        right: Expression;
    }
    
    export interface UnaryExpression extends Expression {
        kind: "unary";
        op: "!";
        expr: Expression;
    }
    
    export interface LiteralExpression extends Expression {
        kind: "literal";
        type: "number"|"string"|"boolean";
        value: any;
    }
    
    export interface IdentifierExpression extends Expression {
        kind: "identifier";
        identifier: string;
    }
}
