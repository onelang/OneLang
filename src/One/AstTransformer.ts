import { IHasTypeArguments, ClassType, InterfaceType, UnresolvedType, LambdaType } from "./Ast/AstTypes";
import { Identifier, BinaryExpression, ConditionalExpression, NewExpression, TemplateString, ParenthesizedExpression, UnaryExpression, PropertyAccessExpression, ElementAccessExpression, ArrayLiteral, MapLiteral, Expression, CastExpression, UnresolvedCallExpression, InstanceOfExpression, AwaitExpression, StringLiteral, NumericLiteral, NullLiteral, RegexLiteral, BooleanLiteral, StaticMethodCallExpression, InstanceMethodCallExpression, UnresolvedNewExpression, NullCoalesceExpression, UnresolvedMethodCallExpression, GlobalFunctionCallExpression, LambdaCallExpression } from "./Ast/Expressions";
import { ReturnStatement, ExpressionStatement, IfStatement, ThrowStatement, VariableDeclaration, WhileStatement, ForStatement, ForeachStatement, Statement, UnsetStatement, BreakStatement, ContinueStatement, DoStatement, TryStatement, Block } from "./Ast/Statements";
import { Method, Constructor, Field, Property, Interface, Class, Enum, EnumMember, SourceFile, IVariable, IVariableWithInitializer, MethodParameter, Lambda, IMethodBase, Package, GlobalFunction, IInterface, IAstNode, IHasAttributesAndTrivia, Import } from "./Ast/Types";
import { ClassReference, EnumReference, ThisReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, InstanceFieldReference, InstancePropertyReference, StaticPropertyReference, StaticFieldReference, CatchVariableReference, GlobalFunctionReference, EnumMemberReference, StaticThisReference, VariableReference } from "./Ast/References";
import { ErrorManager } from "./ErrorManager";
import { ITransformer } from "./ITransformer";
import { IType } from "./Ast/Interfaces";

export abstract class AstTransformer implements ITransformer {
    errorMan: ErrorManager = new ErrorManager();
    currentFile: SourceFile = null;
    currentInterface: IInterface = null;
    currentMethod: IMethodBase = null;
    currentClosure: IMethodBase = null;
    currentStatement: Statement = null;

    constructor(public name: string) { }

    protected visitAttributesAndTrivia(node: IHasAttributesAndTrivia) { }

    protected visitType(type: IType): IType {
        if (type instanceof ClassType || type instanceof InterfaceType || type instanceof UnresolvedType) {
            const type2 = <IHasTypeArguments> type;
            type2.typeArguments = type2.typeArguments.map(x => this.visitType(x));
        } else if (type instanceof LambdaType) {
            for (const mp of type.parameters)
                this.visitMethodParameter(mp);
            type.returnType = this.visitType(type.returnType);
        }
        return type;
    }
 
    protected visitIdentifier(id: Identifier): Expression { 
        return id;
    }

    protected visitVariable(variable: IVariable): IVariable {
        if (variable.type !== null)
            variable.type = this.visitType(variable.type);
        return variable;
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer): IVariableWithInitializer {
        this.visitVariable(variable);
        if (variable.initializer !== null)
            variable.initializer = this.visitExpression(variable.initializer);
        return variable;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
        this.visitVariableWithInitializer(stmt);
        return stmt;
    }

    protected visitUnknownStatement(stmt: Statement): Statement {
        this.errorMan.throw(`Unknown statement type`);
        return stmt;
    }

    protected visitStatement(stmt: Statement): Statement {
        this.currentStatement = stmt;
        this.visitAttributesAndTrivia(stmt);
        if (stmt instanceof ReturnStatement) {
            if (stmt.expression !== null)
                stmt.expression = this.visitExpression(stmt.expression);
        } else if (stmt instanceof ExpressionStatement) {
            stmt.expression = this.visitExpression(stmt.expression);
        } else if (stmt instanceof IfStatement) {
            stmt.condition = this.visitExpression(stmt.condition);
            stmt.then = this.visitBlock(stmt.then);
            if (stmt.else_ !== null)
                stmt.else_ = this.visitBlock(stmt.else_);
        } else if (stmt instanceof ThrowStatement) {
            stmt.expression = this.visitExpression(stmt.expression);
        } else if (stmt instanceof VariableDeclaration) {
            return this.visitVariableDeclaration(stmt);
        } else if (stmt instanceof WhileStatement) {
            stmt.condition = this.visitExpression(stmt.condition);
            stmt.body = this.visitBlock(stmt.body);
        } else if (stmt instanceof DoStatement) {
            stmt.condition = this.visitExpression(stmt.condition);
            stmt.body = this.visitBlock(stmt.body);    
        } else if (stmt instanceof ForStatement) {
            if (stmt.itemVar !== null)
                this.visitVariableWithInitializer(stmt.itemVar);
            stmt.condition = this.visitExpression(stmt.condition);
            stmt.incrementor = this.visitExpression(stmt.incrementor);
            stmt.body = this.visitBlock(stmt.body);
        } else if (stmt instanceof ForeachStatement) {
            this.visitVariable(stmt.itemVar);
            stmt.items = this.visitExpression(stmt.items);
            stmt.body = this.visitBlock(stmt.body);
        } else if (stmt instanceof TryStatement) {
            stmt.tryBody = this.visitBlock(stmt.tryBody);
            if (stmt.catchBody !== null) {
                this.visitVariable(stmt.catchVar);
                stmt.catchBody = this.visitBlock(stmt.catchBody);
            }
            if (stmt.finallyBody !== null)
                stmt.finallyBody = this.visitBlock(stmt.finallyBody);
        } else if (stmt instanceof BreakStatement) {
            // ...
        } else if (stmt instanceof UnsetStatement) {
            stmt.expression = this.visitExpression(stmt.expression);
        } else if (stmt instanceof ContinueStatement) {
            // ...
        } else {
            return this.visitUnknownStatement(stmt);
        }
        return stmt;
    }

    protected visitBlock(block: Block): Block {
        block.statements = block.statements.map(x => this.visitStatement(x));
        return block;
    }

    protected visitTemplateString(expr: TemplateString): TemplateString {
        for (let i = 0; i < expr.parts.length; i++) {
            const part = expr.parts[i];
            if(!part.isLiteral)
                part.expression = this.visitExpression(part.expression);
        }
        return expr;
    }
    
    protected visitUnknownExpression(expr: Expression): Expression {
        this.errorMan.throw(`Unknown expression type`);
        return expr;
    }

    protected visitLambda(lambda: Lambda): Lambda {
        const prevClosure = this.currentClosure;
        this.currentClosure = lambda;
        this.visitMethodBase(lambda);
        this.currentClosure = prevClosure;
        return lambda;
    }

    protected visitVariableReference(varRef: VariableReference): VariableReference {
        return varRef;
    }

    protected visitExpression(expr: Expression): Expression {
        if (expr instanceof BinaryExpression) {
            expr.left = this.visitExpression(expr.left);
            expr.right = this.visitExpression(expr.right);
        } else if (expr instanceof NullCoalesceExpression) {
            expr.defaultExpr = this.visitExpression(expr.defaultExpr);
            expr.exprIfNull = this.visitExpression(expr.exprIfNull);
        } else if (expr instanceof UnresolvedCallExpression) {
            expr.func = this.visitExpression(expr.func);
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x));
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof UnresolvedMethodCallExpression) {
            expr.object = this.visitExpression(expr.object);
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x));
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof ConditionalExpression) {
            expr.condition = this.visitExpression(expr.condition);
            expr.whenTrue = this.visitExpression(expr.whenTrue);
            expr.whenFalse = this.visitExpression(expr.whenFalse);
        } else if (expr instanceof Identifier) {
            return this.visitIdentifier(expr);
        } else if (expr instanceof UnresolvedNewExpression) {
            this.visitType(expr.cls);
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof NewExpression) {
            this.visitType(expr.cls);
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof TemplateString) {
            return this.visitTemplateString(expr);
        } else if (expr instanceof ParenthesizedExpression) {
            expr.expression = this.visitExpression(expr.expression);
        } else if (expr instanceof UnaryExpression) {
            expr.operand = this.visitExpression(expr.operand);
        } else if (expr instanceof PropertyAccessExpression) {
            expr.object = this.visitExpression(expr.object);
        } else if (expr instanceof ElementAccessExpression) {
            expr.object = this.visitExpression(expr.object);
            expr.elementExpr = this.visitExpression(expr.elementExpr);
        } else if (expr instanceof ArrayLiteral) {
            expr.items = expr.items.map(x => this.visitExpression(x));
        } else if (expr instanceof MapLiteral) {
            for (const item of expr.items)
                item.value = this.visitExpression(item.value);
        } else if (expr instanceof StringLiteral) {
        } else if (expr instanceof BooleanLiteral) {
        } else if (expr instanceof NumericLiteral) {
        } else if (expr instanceof NullLiteral) {
        } else if (expr instanceof RegexLiteral) {
        } else if (expr instanceof CastExpression) {
            expr.newType = this.visitType(expr.newType);
            expr.expression = this.visitExpression(expr.expression);
        } else if (expr instanceof InstanceOfExpression) {
            expr.expr = this.visitExpression(expr.expr);
            expr.checkType = this.visitType(expr.checkType);
        } else if (expr instanceof AwaitExpression) {
            expr.expr = this.visitExpression(expr.expr);
        } else if (expr instanceof Lambda) {
            return this.visitLambda(expr);
        } else if (expr instanceof ClassReference) {
        } else if (expr instanceof EnumReference) {
        } else if (expr instanceof ThisReference) {
        } else if (expr instanceof StaticThisReference) {
        } else if (expr instanceof MethodParameterReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof VariableDeclarationReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof ForVariableReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof ForeachVariableReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof CatchVariableReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof GlobalFunctionReference) {
        } else if (expr instanceof SuperReference) {
        } else if (expr instanceof InstanceFieldReference) {
            expr.object = this.visitExpression(expr.object);
            return this.visitVariableReference(expr);
        } else if (expr instanceof InstancePropertyReference) {
            expr.object = this.visitExpression(expr.object);
            return this.visitVariableReference(expr);
        } else if (expr instanceof StaticFieldReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof StaticPropertyReference) {
            return this.visitVariableReference(expr);
        } else if (expr instanceof EnumMemberReference) {
        } else if (expr instanceof StaticMethodCallExpression) {
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x));
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof GlobalFunctionCallExpression) {
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof InstanceMethodCallExpression) {
            expr.object = this.visitExpression(expr.object);
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x));
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else if (expr instanceof LambdaCallExpression) {
            expr.args = expr.args.map(x => this.visitExpression(x));
        } else {
            return this.visitUnknownExpression(expr);
        }
        return expr;
    }

    protected visitMethodParameter(methodParameter: MethodParameter): void {
        this.visitAttributesAndTrivia(methodParameter);
        this.visitVariableWithInitializer(methodParameter);
    }

    protected visitMethodBase(method: IMethodBase): void {
        for (const item of method.parameters)
            this.visitMethodParameter(item);

        if (method instanceof Constructor && method.superCallArgs !== null)
            for (let i = 0; i < method.superCallArgs.length; i++)
                method.superCallArgs[i] = this.visitExpression(method.superCallArgs[i]);

        if (method.body !== null)
            method.body = this.visitBlock(method.body);
    }

    protected visitMethod(method: Method) {
        this.currentMethod = method;
        this.currentClosure = method;
        this.visitAttributesAndTrivia(method);
        this.visitMethodBase(method);
        method.returns = this.visitType(method.returns);
        this.currentClosure = null;
        this.currentMethod = null;
    }
 
    protected visitGlobalFunction(func: GlobalFunction) {
        this.visitMethodBase(func);
        func.returns = this.visitType(func.returns);
    }
 
    protected visitConstructor(constructor: Constructor) {
        this.currentMethod = constructor;
        this.currentClosure = constructor;
        this.visitAttributesAndTrivia(constructor);
        this.visitMethodBase(constructor);
        this.currentClosure = null;
        this.currentMethod = null;
    }
 
    protected visitField(field: Field) {
        this.visitAttributesAndTrivia(field);
        this.visitVariableWithInitializer(field);
    }
 
    protected visitProperty(prop: Property) {
        this.visitAttributesAndTrivia(prop);
        this.visitVariable(prop);
        if (prop.getter !== null)
            prop.getter = this.visitBlock(prop.getter);
        if (prop.setter !== null)
            prop.setter = this.visitBlock(prop.setter);
    }

    protected visitInterface(intf: Interface) {
        this.currentInterface = intf;
        this.visitAttributesAndTrivia(intf);
        intf.baseInterfaces = intf.baseInterfaces.map(x => this.visitType(x));
        for (const field of intf.fields)
            this.visitField(field);
        for (const method of intf.methods)
            this.visitMethod(method);
        this.currentInterface = null;
    }

    protected visitClass(cls: Class) {
        this.currentInterface = cls;
        this.visitAttributesAndTrivia(cls);
        if (cls.constructor_ !== null)
            this.visitConstructor(cls.constructor_);

        cls.baseClass = this.visitType(cls.baseClass);
        cls.baseInterfaces = cls.baseInterfaces.map(x => this.visitType(x));
        for (const field of cls.fields)
            this.visitField(field);
        for (const prop of cls.properties)
            this.visitProperty(prop);
        for (const method of cls.methods)
            this.visitMethod(method);
        this.currentInterface = null;
    }
 
    protected visitEnum(enum_: Enum) {
        this.visitAttributesAndTrivia(enum_);
        for (const value of enum_.values)
            this.visitEnumMember(value);
    }

    protected visitEnumMember(enumMember: EnumMember): void {
    }

    protected visitImport(imp: Import): void {
        this.visitAttributesAndTrivia(imp);
    }

    public visitFile(sourceFile: SourceFile): void {
        this.errorMan.resetContext(this);
        this.currentFile = sourceFile;
        for (const imp of sourceFile.imports)
            this.visitImport(imp);
        for (const enum_ of sourceFile.enums)
            this.visitEnum(enum_);
        for (const intf of sourceFile.interfaces)
            this.visitInterface(intf);
        for (const cls of sourceFile.classes)
            this.visitClass(cls);
        for (const func of sourceFile.funcs)
            this.visitGlobalFunction(func);
        sourceFile.mainBlock = this.visitBlock(sourceFile.mainBlock);
        this.currentFile = null;
    }

    public visitFiles(files: SourceFile[]): void {
        for (const file of files)
            this.visitFile(file);
    }

    public visitPackage(pkg: Package) {
        this.visitFiles(Object.values(pkg.files));
    }
}