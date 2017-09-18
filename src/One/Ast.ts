export namespace OneAst {
    export interface Schema {
        meta: { transforms?: { [name: string]: boolean } };
        globals: { [name: string]: VariableDeclaration };
        enums: { [name: string]: Enum };
        classes: { [name: string]: Class };
    }

    export interface NamedItem {
        name?: string;
        metaPath?: string;
    }

    export interface Enum extends NamedItem {
        values: EnumMember[];
    }

    export interface EnumMember {
        name: string;
    }

    export interface Class extends NamedItem {
        parentRef?: Schema;
        fields: { [name: string]: Field };
        properties: { [name: string]: Property };
        constructor: Constructor;
        methods: { [name: string]: Method };
        meta?: {
            iterable?: boolean;
            overlay?: boolean;
        }
    }

    export enum Visibility { Public = "public", Protected = "protected", Private = "private" }
    
    export enum TypeKind { 
        Void = "void",
        Boolean = "boolean",
        String = "string",
        Number = "number",
        Null = "null",
        Any = "any",
        Class = "class",
        Method = "method",
    }

    export interface IType {
        typeKind: TypeKind;
        className: string;
        typeArguments: Type[];
        classType: Type;
        methodName: string;
    }

    export class Type implements IType {
        $objType = "Type";
        constructor(public typeKind: TypeKind = null) { }
        
        public className: string;
        public typeArguments: Type[];
        public classType: Type;
        public methodName: string;

        get isPrimitiveType() { return Type.PrimitiveTypeKinds.includes(this.typeKind); }
        get isClass() { return this.typeKind === TypeKind.Class; }
        get isMethod() { return this.typeKind === TypeKind.Method; }

        equals(other: Type) {
            if (this.typeKind !== other.typeKind)
                return false;

            if (this.isPrimitiveType)
                return true;

            const typeArgsMatch = this.typeArguments.length === other.typeArguments.length
                && this.typeArguments.every((thisArg, i) => thisArg.equals(other.typeArguments[i]));

            if (this.typeKind === TypeKind.Class)
                return this.className === other.className && typeArgsMatch;
            else
                throw new Error(`Type.equals: Unknown typeKind: ${this.typeKind}`);
        }

        repr() {
            if (this.isPrimitiveType) {
                return this.typeKind.toString();
            } else if (this.isClass) {
                return this.className + (this.typeArguments.length === 0 ? "" : 
                    `<${this.typeArguments.map(x => x.repr()).join(", ")}>`);
            } else if (this.isMethod) {
                return `${this.classType.repr()}::${this.methodName}`;
            } else {
                return "?";
            }
        }

        static PrimitiveTypeKinds = [TypeKind.Void, TypeKind.Boolean, TypeKind.String, TypeKind.Number, TypeKind.Null, TypeKind.Any];
        
        static Void = new Type(TypeKind.Void);
        static Boolean = new Type(TypeKind.Boolean);
        static String = new Type(TypeKind.String);
        static Number = new Type(TypeKind.Number);
        static Null = new Type(TypeKind.Null);
        static Any = new Type(TypeKind.Any);
        
        static Class(className: string, generics: Type[] = []) {
            const result = new Type(TypeKind.Class);
            result.className = className;
            result.typeArguments = generics;
            return result;
        }

        static Method(classType: Type, methodName: string) {
            const result = new Type(TypeKind.Method);
            result.classType = classType;
            result.methodName = methodName;
            return result;
        }

        static Load(source: IType) {
            return Object.assign(new Type(), source);
        }
    }

    export interface VariableBase extends NamedItem {
        type: Type;
    }

    export interface Field extends VariableBase {
        visibility: Visibility;
        defaultValue?: any;
    }

    export interface Property extends VariableBase {
        visibility: Visibility;
        getter: Method;
        setter: Method;
    }

    export interface MethodParameter extends VariableDeclaration { }

    export interface Constructor {
        parameters: MethodParameter[];
        body: Block;
    }

    export interface Method extends NamedItem {
        parentRef?: Class;
        static: boolean;
        parameters: MethodParameter[];
        returns: Type;
        body: Block;
    }

    export type MethodLike = Method | Constructor;

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
        LocalVariableRef = "LocalVariableRef",
        ClassFieldRef = "ClassFieldRef",
        MethodReference = "MethodReference",
        ThisReference = "ThisReference",
        ClassReference = "ClassReference",
    }

    export interface Expression {
        exprKind: ExpressionKind;
        parentRef?: Expression|Statement;
        valueType?: Type;
    }

    export abstract class Reference implements Expression {
        abstract exprKind: ExpressionKind;
        parentRef?: Expression | Statement;
        valueType?: Type;
    }

    export class LocalVariableRef extends Reference {
        exprKind = ExpressionKind.LocalVariableRef;

        constructor(public varRef?: VariableBase, public isArgument = false) { super(); }
    }

    export class ClassFieldRef extends Reference {
        exprKind = ExpressionKind.ClassFieldRef;

        constructor(public classRef: Class, public varRef?: VariableBase, public thisExpr?: Expression) { super(); }
    }

    export class MethodReference extends Reference {
        exprKind = ExpressionKind.MethodReference;

        constructor(public classRef: Class, public methodRef: Method, public thisExpr?: Expression) { super(); }
    }

    export class ClassReference extends Reference {
        exprKind = ExpressionKind.ClassReference;
        
        constructor(public classRef: Class) { super(); }
    }

    export class ThisReference extends Reference {
        exprKind = ExpressionKind.ThisReference;

        static instance = new ThisReference();
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

    export interface ArrayLiteral extends Expression {
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
        parentRef?: Block;
        stmtType: StatementType;
    }

    export interface IfStatement extends Statement, NamedItem {
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

    export interface VariableDeclaration extends Statement, VariableBase {
        initializer?: Expression;
    }

    export interface WhileStatement extends Statement, NamedItem {
        condition: Expression;
        body: Block;
    }

    export interface ForeachStatement extends Statement, NamedItem {
        itemVariable: VariableDeclaration;
        items: Expression;
        body: Block;
    }

    export interface ForStatement extends Statement, NamedItem {
        itemVariable: VariableDeclaration;
        condition: Expression;
        incrementor: Expression;
        body: Block;
    }

    export interface Block extends NamedItem {
        parentRef?: Statement|MethodLike;
        statements: Statement[];
    }
}