export namespace OneAst {
    export interface ILangData {
        literalClassNames: {
            string: string,
            boolean: string,
            numeric: string,
            character: string,
            map: string,
            array: string,
         };
    
         allowImplicitVariableDeclaration: boolean;
    }

    export interface TextRange {
        start: number;
        end: number;
    }

    export interface NodeData {
        sourceRange: TextRange;
        destRanges: { [langName: string]: TextRange };
    }

    export interface INode {
        nodeData?: NodeData;
    }

    export interface Schema {
        sourceType: "program"|"overlay"|"stdlib";
        langData: ILangData;
        meta: { transforms?: { [name: string]: boolean } };
        globals: { [name: string]: VariableDeclaration };
        enums: { [name: string]: Enum };
        classes: { [name: string]: Class };
    }

    export interface NamedItem extends INode {
        name?: string;
        outName?: string;
        metaPath?: string;
    }

    export interface Enum extends NamedItem {
        name?: string;
        values: EnumMember[];
        type?: Type;
        leadingTrivia: string;
    }

    export interface EnumMember extends NamedItem {
        name: string;
    }

    export interface Class extends NamedItem {
        schemaRef?: Schema;
        type?: Type;
        fields: { [name: string]: Field };
        properties: { [name: string]: Property };
        constructor: Constructor;
        methods: { [name: string]: Method };
        typeArguments: string[];
        meta?: {
            iterable?: boolean;
            overlay?: boolean;
            stdlib?: boolean;
        };
        leadingTrivia: string;
    }

    export enum Visibility { Public = "public", Protected = "protected", Private = "private" }
    
    export enum TypeKind { 
        Void = "void",
        Any = "any",
        Null = "null",
        Class = "class",
        Enum = "enum",
        Method = "method",
        Generics = "generics"
    }

    export class Type implements INode {
        $objType = "Type";
        
        constructor(public typeKind: TypeKind = null) { }
        
        public className: string;
        public enumName: string;
        public typeArguments: Type[];
        public classType: Type;
        public methodName: string;
        public genericsName: string;
        nodeData?: NodeData;        

        get isPrimitiveType() { return Type.PrimitiveTypeKinds.includes(this.typeKind); }
        get isClass() { return this.typeKind === TypeKind.Class; }
        get isComplexClass() { return this.canBeNull && !this.isAny; } // TODO: hack for C++ (any) & Go (interface{})
        get isEnum() { return this.typeKind === TypeKind.Enum; }
        get isMethod() { return this.typeKind === TypeKind.Method; }
        get isGenerics() { return this.typeKind === TypeKind.Generics; }
        get isAny() { return this.typeKind === TypeKind.Any; }
        get isNull() { return this.typeKind === TypeKind.Null; }
        get isVoid() { return this.typeKind === TypeKind.Void; }
        get isNumber() { return this.className === "OneNumber"; }
        get isString() { return this.className === "OneString"; }
        get isCharacter() { return this.className === "OneCharacter"; }
        get isBoolean() { return this.className === "OneBoolean"; }
        get isOneArray() { return this.className === "OneArray"; }
        get isOneMap() { return this.className === "OneMap"; }

        get canBeNull() { return (this.typeKind === TypeKind.Class && !this.isNumber && !this.isCharacter && !this.isString && !this.isBoolean) || this.isAny; }

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
            } else if (this.isGenerics) {
                return this.genericsName;
            } else if (this.isEnum) {
                return `${this.enumName} (enum)`;
            } else {
                return "?";
            }
        }

        static PrimitiveTypeKinds = [TypeKind.Void, TypeKind.Any, TypeKind.Null];

        // TODO / note: new instance is required because of NodeData... maybe rethink this approach?
        static get Void() { return new Type(TypeKind.Void); }
        static get Any() { return new Type(TypeKind.Any); }
        static get Null() { return new Type(TypeKind.Null); }
        
        static Class(className: string, generics: Type[] = []) {
            if (!className)
                throw new Error("expected className in Type.Class");

            const result = new Type(TypeKind.Class);
            result.className = className;
            result.typeArguments = generics;
            return result;
        }

        static Enum(enumName: string) {
            const result = new Type(TypeKind.Enum);
            result.enumName = enumName;
            return result;
        }

        static Method(classType: Type, methodName: string) {
            const result = new Type(TypeKind.Method);
            result.classType = classType;
            result.methodName = methodName;
            return result;
        }

        static Generics(genericsName: string) {
            const result = new Type(TypeKind.Generics);
            result.genericsName = genericsName;
            return result;
        }

        static Load(source: Type) {
            return Object.assign(new Type(), source);
        }
    }

    export interface VariableBase extends NamedItem {
        type: Type;
        isUnused?: boolean;
        isMutable?: boolean;
    }

    export interface Field extends VariableDeclaration {
        classRef?: Class;
        visibility: Visibility;
        static: boolean;
    }

    export interface Property extends VariableBase {
        classRef?: Class;
        visibility: Visibility;
        static: boolean;
        getter: Block;
        setter: Block;
    }

    export interface MethodParameter extends VariableDeclaration { }

    export interface Constructor extends NamedItem {
        classRef?: Class;
        parameters: MethodParameter[];
        body: Block;
        throws: boolean;
    }

    export interface Method extends NamedItem {
        type?: Type;
        classRef?: Class;
        typeArguments: string[];
        static: boolean;
        parameters: MethodParameter[];
        returns: Type;
        body: Block;
        throws: boolean;
        mutates: boolean;
        visibility?: Visibility;
        leadingTrivia: string;
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
        TemplateString = "TemplateString",
        Parenthesized = "Parenthesized",
        Unary = "Unary",
        Cast = "Cast",
        ArrayLiteral = "ArrayLiteral",
        MapLiteral = "MapLiteral",
        VariableReference = "VariableReference",
        MethodReference = "MethodReference",
        ThisReference = "ThisReference",
        ClassReference = "ClassReference",
        EnumReference = "EnumReference",
        EnumMemberReference = "EnumMemberReference",
    }

    export interface Expression extends INode {
        exprKind: ExpressionKind;
        parentRef?: Expression|Statement;
        valueType?: Type;
        typeArgs?: string[];
    }

    export interface CallArgument extends Expression {
        paramName?: string;
    }

    export abstract class Reference implements Expression {
        abstract exprKind: ExpressionKind;
        parentRef?: Expression | Statement;
        valueType?: Type;
    }

    export enum VariableRefType { 
        StaticField = "StaticField",
        InstanceField = "InstanceField",
        MethodArgument = "MethodArgument",
        LocalVar = "LocalVar",
    }

    export class VariableRef extends Reference {
        $objType = "VariableRef";
        exprKind = ExpressionKind.VariableReference;

        static InstanceField(thisExpr: Expression, varRef: VariableBase) {
            return new VariableRef(VariableRefType.InstanceField, varRef, thisExpr);
        }

        static StaticField(thisExpr: Expression, varRef: VariableBase) {
            return new VariableRef(VariableRefType.StaticField, varRef, thisExpr);
        }

        static MethodVariable(varRef: VariableBase) {
            return new VariableRef(VariableRefType.LocalVar, varRef);
        }

        static MethodArgument(varRef: VariableBase) {
            return new VariableRef(VariableRefType.MethodArgument, varRef);
        }

        static Load(source: any) {
            return Object.assign(new VariableRef(null, null), source);
        }

        protected constructor(public varType: VariableRefType, public varRef: VariableBase, public thisExpr?: Expression) { super(); }
    }

    export class MethodReference extends Reference {
        exprKind = ExpressionKind.MethodReference;

        constructor(public methodRef: Method, public thisExpr?: Expression) { super(); }
    }

    export class ClassReference extends Reference {
        exprKind = ExpressionKind.ClassReference;
        
        constructor(public classRef: Class) { super(); }
    }

    export class EnumReference extends Reference {
        exprKind = ExpressionKind.EnumReference;
        
        constructor(public enumRef: Enum) { super(); }
    }

    export class EnumMemberReference extends Reference {
        exprKind = ExpressionKind.EnumMemberReference;
        
        constructor(public enumMemberRef: EnumMember, public enumRef: Enum) { super(); }
    }

    export class ThisReference extends Reference {
        exprKind = ExpressionKind.ThisReference;
    }

    export interface CallExpression extends Expression {
        method: Expression|MethodReference;
        arguments: CallArgument[];
    }

    export interface Identifier extends Expression {
        text: string;
    }

    export interface Literal extends Expression {
        literalType: "numeric"|"string"|"character"|"boolean"|"null";
        value: any;
        escapedText: string;
        escapedTextSingle: string;
    }

    export interface TemplateStringPart {
        literal: boolean;
        text?: string;
        expr?: Expression;
    }

    export interface TemplateString extends Expression {
        parts: TemplateStringPart[];
    }

    export interface ArrayLiteral extends Expression {
        items: Expression[];
    }

    export interface MapLiteral extends Expression {
        properties: VariableDeclaration[];
    }

    export interface NewExpression extends Expression {
        cls: Identifier|ClassReference;
        typeArguments: Type[];
        arguments: CallArgument[];
    }

    export interface BinaryExpression extends Expression {
        left: Expression;
        operator: string;
        right: Expression;
    }

    export interface UnaryExpression extends Expression {
        unaryType: "postfix"|"prefix";
        operator: string; //"++" | "--" | "+" | "-" | "~" | "!";
        operand: Expression;
    }

    export interface CastExpression extends Expression {
        expression: Expression;
        newType: Type;
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
        ExpressionStatement = "ExpressionStatement",
        VariableDeclaration = "VariableDeclaration",
        While = "While",
        Throw = "Throw",
        Foreach = "Foreach",
        For = "For",
        Break = "Break",
        Unset = "Unset",
    }

    export interface Statement extends INode {
        leadingTrivia?: string;
        leadingTrivia2?: string;
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

    export interface UnsetStatement extends Statement {
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
        itemVariable: VariableBase;
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