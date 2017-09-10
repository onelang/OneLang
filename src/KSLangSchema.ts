export namespace KSLangSchema {
    export interface SchemaFile {
        enums: { [name: string]: Enum };
        classes: { [name: string]: Class };
    }

    export interface Enum {
        name?: string;
        origName?: string;
        values: EnumMember[];
    }

    export interface EnumMember {
        name: string;
    }

    export interface Class {
        name?: string;
        origName?: string;
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
        origName?: string;
        name?: string;
        parameters: MethodParameter[];
        returns: Type;
        body: Block;
    }

    // ======================= EXPRESSIONS ======================

    export enum ExpressionType {
        Call = "Call",
        Binary = "Binary",
        PropertyAccess = "PropertyAccess",
        Identifier = "Identifier",
        New = "New",
        Conditional = "Conditional",
        Literal = "Literal",
        Parenthesized = "Parenthesized",
        Unary = "Unary",
        ArrayLiteral = "ArrayLiteral",
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

    export interface Literal extends Expression {
        literalType: "numeric"|"string"|"boolean"|"null";
        value: string;
    }

    export interface ArrayLiteralExpression extends Expression {
        items: Expression[];
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

    export interface UnaryExpression extends Expression {
        unaryType: "postfix"|"prefix";
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

    // ======================= STATEMENTS ======================

    export enum StatementType { 
        If = "If",
        Return = "Return",
        Expression = "Expression",
        Variable = "Variable",
        While = "While",
        Throw = "Throw",
        Foreach = "Foreach",
        For = "For",
    }

    export interface Statement {
        type: StatementType;
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

    export interface VariableDeclaration extends Statement {
        variableName: string;
        initializer: Expression;
    }

    export interface WhileStatement extends Statement {
        condition: Expression;
        body: Block;
    }

    export interface ForeachStatement extends Statement {
        itemVariable: VariableDeclaration;
        items: Expression;
        body: Block;
    }

    export interface ForStatement extends Statement {
        itemVariable: VariableDeclaration;
        condition: Expression;
        incrementor: Expression;
        body: Block;
    }

    export interface Block {
        statements: Statement[];
    }
}
