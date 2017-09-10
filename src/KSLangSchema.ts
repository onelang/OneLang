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
    
    export enum TypeKind { 
        Void = "void",
        Boolean = "boolean",
        String = "string",
        Number = "number",
        Null = "null",
        Any = "any",
        Array = "array",
        Class = "class",
    }

    export class Type {
        static PrimitiveTypeKinds = [TypeKind.Void, TypeKind.Boolean, TypeKind.String, TypeKind.Number, TypeKind.Null, TypeKind.Any];
        
        static Void = new Type(TypeKind.Void);
        static Boolean = new Type(TypeKind.Boolean);
        static String = new Type(TypeKind.String);
        static Number = new Type(TypeKind.Number);
        static Null = new Type(TypeKind.Null);
        static Any = new Type(TypeKind.Any);
        static Array(itemType: Type) { return new Type(TypeKind.Array, null, [itemType]); }
        static Class(className: string, generics: Type[]) { return new Type(TypeKind.Array, className, generics); }

        get isPrimitiveType() { return Type.PrimitiveTypeKinds.includes(this.typeKind); }
        get isArray() { return this.typeKind === TypeKind.Array; }
        get isClass() { return this.typeKind === TypeKind.Class; }

        constructor(public typeKind: TypeKind = null, public className: string = null, public typeArguments: Type[] = null) { }

        equals(other: Type) {
            if (this.typeKind !== other.typeKind)
                return false;

            if (this.isPrimitiveType)
                return true;

            const typeArgsMatch = this.typeArguments.length === other.typeArguments.length
                && this.typeArguments.every((thisArg, i) => thisArg.equals(other.typeArguments[i]));

            if (this.typeKind === TypeKind.Array)
                return typeArgsMatch;
            else if (this.typeKind === TypeKind.Class)
                return this.className === other.className && typeArgsMatch;
            else
                throw new Error(`Type.equals: Unknown typeKind: ${this.typeKind}`);
        }

        repr() {
            const argsRepr = () => this.typeArguments.map(x => x.repr()).join(", ");
            if (this.isPrimitiveType)
                return this.typeKind.toString();
            else if (this.isArray)
                return `array<${argsRepr()}>`;
            else if (this.isClass)
                return `${this.className}<${argsRepr()}>`;
            else
                return "?";
        }
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

    export enum ExpressionKind {
        Call = "Call",
        Binary = "Binary",
        PropertyAccess = "PropertyAccess",
        ElementAccess = "ElementAccess",
        Identifier = "Identifier",
        New = "New",
        Conditional = "Conditional",
        Literal = "Literal",
        Parenthesized = "Parenthesized",
        Unary = "Unary",
        ArrayLiteral = "ArrayLiteral",
    }

    export interface Expression {
        exprKind: ExpressionKind;
        valueType: Type;
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
        propertyName: string;
    }

    export interface ElementAccessExpression extends Expression {
        object: Expression;
        elementExpr: Expression;
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
        stmtType: StatementType;
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
