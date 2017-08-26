export namespace KSLangSchema {
    export interface SchemaFile {
        enums: { [name: string]: Enum };
        classes: { [name: string]: Class };
    }

    export interface Enum {
        name?: string;
        values: EnumMember[];
    }

    export interface EnumMember {
        name: string;
    }

    export interface Class {
        name?: string;
        fields: { [name: string]: Field };
        constructor: Constructor;
        methods: { [name: string]: Method };
    }

    export enum Visibility { Public = "public", Protected = "protected", Private = "private" }
    
    export enum PrimitiveType { 
        Void = "void",
        Boolean = "boolean",
        Array = "array",
        String = "string",
        Int32 = "int32",
        Class = "class"
    }

    export interface Type {
        type: PrimitiveType;
        className: string;
        typeArguments: Type[];
    }

    export interface VariableBase {
        name?: string;
        type: Type;
    }

    export interface Field extends VariableBase {
        visibility: Visibility;
        defaultValue: any;
    }

    export interface MethodParameter extends VariableBase { }

    export interface Constructor {
        parameters: MethodParameter[];
        body: Block;
    }

    export interface Method {
        name?: string;
        parameters: MethodParameter[];
        returns: Type;
        body: Block;
    }

    export enum StatementType { 
        If = "If",
        Return = "Return",
        Expression = "Expression",
        Variable = "Variable",
        While = "While",
        Throw = "Throw",
    }

    export interface Statement {
        type: StatementType;
    }

    export enum ExpressionType {
        Call = "Call",
        Binary = "Binary",
        PropertyAccess = "PropertyAccess",
        Identifier = "Identifier",
        New = "New",
        Conditional = "Conditional",
        StringLiteral = "StringLiteral",
        NumericLiteral = "NumericLiteral",
        Parenthesized = "Parenthesized",
        PostfixUnary = "PostfixUnary",
        PrefixUnary = "PrefixUnary",
    }

    export interface Expression {
        type: ExpressionType;
    }

    export interface CallExpression extends Expression {
        method: Expression;
        arguments: Expression[];
    }

    export interface Identifier extends Expression {
        text: string;
    }

    export interface StringLiteral extends Expression {
        value: string;
    }

    export interface NumericLiteral extends Expression {
        value: string;
    }

    export interface NewExpression extends Expression {
        class: Expression;
        arguments: Expression[];
    }

    export interface BinaryExpression extends Expression {
        left: Expression;
        operator: string;
        right: Expression;
    }

    export interface PostfixUnaryExpression extends Expression {
        operator: "++" | "--";
        operand: Expression;
    }

    export interface PrefixUnaryExpression extends Expression {
        operator: "++" | "--" | "+" | "-" | "~" | "!";
        operand: Expression;
    }

    export interface ParenthesizedExpression extends Expression {
        expression: Expression;
    }

    export interface ConditionalExpression extends Expression {
        condition: Expression;
        whenTrue: Expression;
        whenFalse: Expression;
    }

    export interface PropertyAccessExpression extends Expression {
        object: Expression;
        propertyName: Expression;
    }

    export interface IfStatement extends Statement {
        condition: Expression;
        then: Block;
        else: Block;
    }

    export interface ReturnStatement extends Statement {
        expression: Expression;
    }

    export interface ThrowStatement extends Statement {
        expression: Expression;
    }

    export interface ExpressionStatement extends Statement {
        expression: Expression;
    }

    export interface VariableStatement extends Statement {
        variableName: string;
        initializer: Expression;
    }

    export interface WhileStatement extends Statement {
        condition: Expression;
        body: Block;
    }

    export interface Block {
        statements: Statement[];
    }
}
