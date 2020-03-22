import { Type, IHasTypeArguments, ClassType, InterfaceType, UnresolvedType, LambdaType } from "./Ast/AstTypes";
import { Identifier, BinaryExpression, ConditionalExpression, NewExpression, TemplateString, ParenthesizedExpression, UnaryExpression, PropertyAccessExpression, ElementAccessExpression, ArrayLiteral, MapLiteral, Expression, CastExpression, UnresolvedCallExpression, InstanceOfExpression, AwaitExpression, StringLiteral, NumericLiteral, NullLiteral, RegexLiteral, BooleanLiteral, StaticMethodCallExpression, InstanceMethodCallExpression, UnresolvedNewExpression, NullCoalesceExpression, UnresolvedMethodCallExpression } from "./Ast/Expressions";
import { ReturnStatement, ExpressionStatement, IfStatement, ThrowStatement, VariableDeclaration, WhileStatement, ForStatement, ForeachStatement, Statement, UnsetStatement, BreakStatement, ContinueStatement, DoStatement, TryStatement } from "./Ast/Statements";
import { Block, Method, Constructor, Field, Property, Interface, Class, Enum, EnumMember, SourceFile, IVariable, IVariableWithInitializer, MethodParameter, Lambda, IMethodBase, Package, GlobalFunction, IInterface, IAstNode } from "./Ast/Types";
import { ClassReference, EnumReference, ThisReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, InstanceFieldReference, InstancePropertyReference, StaticPropertyReference, StaticFieldReference, CatchVariableReference, GlobalFunctionReference } from "./Ast/References";
import { ErrorManager } from "./ErrorManager";

export abstract class AstTransformer {
    name: string = "AstTransformer";
    errorMan: ErrorManager = new ErrorManager();
    currentFile: SourceFile = null;
    currentInterface: IInterface = null;
    currentMethod: IMethodBase = null;
    currentStatement: Statement = null;

    protected visitType(type: Type): Type {
        if (type instanceof ClassType || type instanceof InterfaceType || type instanceof UnresolvedType) {
            const type2 = <IHasTypeArguments> type;
            type2.typeArguments = type2.typeArguments.map(x => this.visitType(x) || x);
        } else if (type instanceof LambdaType) {
            for (const mp of type.parameters)
                this.visitMethodParameter(mp);
            type.returnType = this.visitType(type.returnType) || type.returnType;
        }
        return null;
    }
 
    protected visitIdentifier(id: Identifier): Expression { 
        return null;
    }

    protected visitVariable(variable: IVariable): IVariable {
        if (variable.type)
            variable.type = this.visitType(variable.type) || variable.type;
        return null;
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer): IVariableWithInitializer {
        this.visitVariable(variable);
        if (variable.initializer)
            variable.initializer = this.visitExpression(variable.initializer) || variable.initializer;
        return null;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
        this.visitVariableWithInitializer(stmt);
        return null;
    }

    protected visitUnknownStatement(stmt: Statement): Statement {
        this.errorMan.throw(`Unknown statement type`);
        return null;
    }

    protected visitStatement(stmt: Statement): Statement {
        this.currentStatement = stmt;
        if (stmt instanceof ReturnStatement) {
            if (stmt.expression)
                stmt.expression = this.visitExpression(stmt.expression) || stmt.expression;
        } else if (stmt instanceof ExpressionStatement) {
            stmt.expression = this.visitExpression(stmt.expression) || stmt.expression;
        } else if (stmt instanceof IfStatement) {
            stmt.condition = this.visitExpression(stmt.condition) || stmt.condition;
            stmt.then = this.visitBlock(stmt.then) || stmt.then;
            if (stmt.else_)
                stmt.else_ = this.visitBlock(stmt.else_) || stmt.else_;
        } else if (stmt instanceof ThrowStatement) {
            stmt.expression = this.visitExpression(stmt.expression) || stmt.expression;
        } else if (stmt instanceof VariableDeclaration) {
            return this.visitVariableDeclaration(stmt);
        } else if (stmt instanceof WhileStatement) {
            stmt.condition = this.visitExpression(stmt.condition) || stmt.condition;
            stmt.body = this.visitBlock(stmt.body) || stmt.body;    
        } else if (stmt instanceof DoStatement) {
            stmt.condition = this.visitExpression(stmt.condition) || stmt.condition;
            stmt.body = this.visitBlock(stmt.body) || stmt.body;    
        } else if (stmt instanceof ForStatement) {
            if (stmt.itemVar)
                this.visitVariableWithInitializer(stmt.itemVar);
            stmt.condition = this.visitExpression(stmt.condition) || stmt.condition;
            stmt.incrementor = this.visitExpression(stmt.incrementor) || stmt.incrementor;
            stmt.body = this.visitBlock(stmt.body) || stmt.body;
        } else if (stmt instanceof ForeachStatement) {
            this.visitVariable(stmt.itemVar);
            stmt.items = this.visitExpression(stmt.items) || stmt.items;
            stmt.body = this.visitBlock(stmt.body) || stmt.body;
        } else if (stmt instanceof TryStatement) {
            stmt.tryBody = this.visitBlock(stmt.tryBody) || stmt.tryBody;
            if (stmt.catchBody !== null) {
                this.visitVariable(stmt.catchVar);
                stmt.catchBody = this.visitBlock(stmt.catchBody) || stmt.catchBody;
            }
            if (stmt.finallyBody !== null)
                stmt.finallyBody = this.visitBlock(stmt.finallyBody) || stmt.finallyBody;
        } else if (stmt instanceof BreakStatement) {
            // ...
        } else if (stmt instanceof UnsetStatement) {
            stmt.expression = this.visitExpression(stmt.expression) || stmt.expression;
        } else if (stmt instanceof ContinueStatement) {
            // ...
        } else {
            return this.visitUnknownStatement(stmt);
        }
        return null;
    }

    protected visitBlock(block: Block): Block {
        block.statements = block.statements.map(x => this.visitStatement(x) || x);
        return null;
    }

    protected visitTemplateString(expr: TemplateString): TemplateString {
        for (let i = 0; i < expr.parts.length; i++) {
            const part = expr.parts[i];
            if(!part.isLiteral)
                part.expression = this.visitExpression(part.expression) || part.expression;
        }
        return null;
    }
    
    protected visitUnknownExpression(expr: Expression): Expression {
        this.errorMan.throw(`Unknown expression type`);
        return null;
    }

    protected visitLambda(lambda: Lambda): Lambda {
        for (const mp of lambda.parameters)
            this.visitMethodParameter(mp);
        lambda.body = this.visitBlock(lambda.body) || lambda.body;
        return null;
    }

    protected visitExpression(expr: Expression): Expression {
        if (expr instanceof BinaryExpression) {
            expr.left = this.visitExpression(expr.left) || expr.left;
            expr.right = this.visitExpression(expr.right) || expr.right;
        } else if (expr instanceof NullCoalesceExpression) {
            expr.defaultExpr = this.visitExpression(expr.defaultExpr) || expr.defaultExpr;
            expr.exprIfNull = this.visitExpression(expr.exprIfNull) || expr.exprIfNull;
        } else if (expr instanceof UnresolvedCallExpression) {
            expr.func = this.visitExpression(expr.func) || expr.func;
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x) || x);
            expr.args = expr.args.map(x => this.visitExpression(x) || x);
        } else if (expr instanceof UnresolvedMethodCallExpression) {
            expr.object = this.visitExpression(expr.object) || expr.object;
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x) || x);
            expr.args = expr.args.map(x => this.visitExpression(x) || x);
        } else if (expr instanceof ConditionalExpression) {
            expr.condition = this.visitExpression(expr.condition) || expr.condition;
            expr.whenTrue = this.visitExpression(expr.whenTrue) || expr.whenTrue;
            expr.whenFalse = this.visitExpression(expr.whenFalse) || expr.whenFalse;
        } else if (expr instanceof Identifier) {
            return this.visitIdentifier(expr);
        } else if (expr instanceof UnresolvedNewExpression) {
            this.visitType(expr.cls);
            expr.args = expr.args.map(x => this.visitExpression(x) || x);
        } else if (expr instanceof NewExpression) {
            this.visitType(expr.cls);
            expr.args = expr.args.map(x => this.visitExpression(x) || x);
        } else if (expr instanceof TemplateString) {
            return this.visitTemplateString(expr);
        } else if (expr instanceof ParenthesizedExpression) {
            expr.expression = this.visitExpression(expr.expression) || expr.expression;
        } else if (expr instanceof UnaryExpression) {
            expr.operand = this.visitExpression(expr.operand) || expr.operand;
        } else if (expr instanceof PropertyAccessExpression) {
            expr.object = this.visitExpression(expr.object) || expr.object;
        } else if (expr instanceof ElementAccessExpression) {
            expr.object = this.visitExpression(expr.object) || expr.object;
            expr.elementExpr = this.visitExpression(expr.elementExpr) || expr.elementExpr;
        } else if (expr instanceof ArrayLiteral) {
            expr.items = expr.items.map(x => this.visitExpression(x) || x);
        } else if (expr instanceof MapLiteral) {
            for (const item of expr.items)
                item.value = this.visitExpression(item.value) || item.value;
        } else if (expr instanceof StringLiteral) {
        } else if (expr instanceof BooleanLiteral) {
        } else if (expr instanceof NumericLiteral) {
        } else if (expr instanceof NullLiteral) {
        } else if (expr instanceof RegexLiteral) {
        } else if (expr instanceof CastExpression) {
            expr.newType = this.visitType(expr.newType) || expr.newType;
            expr.expression = this.visitExpression(expr.expression) || expr.expression;
        } else if (expr instanceof InstanceOfExpression) {
            expr.expr = this.visitExpression(expr.expr) || expr.expr;
            expr.checkType = this.visitType(expr.checkType) || expr.checkType;
        } else if (expr instanceof AwaitExpression) {
            expr.expr = this.visitExpression(expr.expr) || expr.expr;
        } else if (expr instanceof Lambda) {
            return this.visitLambda(expr);
        } else if (expr instanceof ClassReference) {
        } else if (expr instanceof EnumReference) {
        } else if (expr instanceof ThisReference) {
        } else if (expr instanceof MethodParameterReference) {
        } else if (expr instanceof VariableDeclarationReference) {
        } else if (expr instanceof ForVariableReference) {
        } else if (expr instanceof ForeachVariableReference) {
        } else if (expr instanceof CatchVariableReference) {
        } else if (expr instanceof GlobalFunctionReference) {
        } else if (expr instanceof SuperReference) {
        } else if (expr instanceof InstanceFieldReference) {
        } else if (expr instanceof InstancePropertyReference) {
        } else if (expr instanceof StaticFieldReference) {
        } else if (expr instanceof StaticPropertyReference) {
        } else if (expr instanceof StaticMethodCallExpression) {
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x) || x);
            expr.args = expr.args.map(x => this.visitExpression(x) || x);
        } else if (expr instanceof InstanceMethodCallExpression) {
            expr.object = this.visitExpression(expr.object) || expr.object;
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x) || x);
            expr.args = expr.args.map(x => this.visitExpression(x) || x);
        } else {
            return this.visitUnknownExpression(expr);
        }
    }

    protected visitMethodParameter(methodParameter: MethodParameter): void {
        this.visitVariableWithInitializer(methodParameter);
    }

    protected visitMethodBase(method: IMethodBase) {
        for (const item of method.parameters)
            this.visitMethodParameter(item);

        if (method.body)
            method.body = this.visitBlock(method.body) || method.body;
    }

    protected visitMethod(method: Method) {
        this.currentMethod = method;
        this.visitMethodBase(method);
        method.returns = this.visitType(method.returns) || method.returns;
        this.currentMethod = null;
    }
 
    protected visitGlobalFunction(func: GlobalFunction) {
        this.visitMethodBase(func);
        func.returns = this.visitType(func.returns) || func.returns;
    }
 
    protected visitConstructor(constructor: Constructor) {
        this.currentMethod = constructor;
        this.visitMethodBase(constructor);
        this.currentMethod = null;
    }
 
    protected visitField(field: Field) {
        this.visitVariableWithInitializer(field);
    }
 
    protected visitProperty(prop: Property) {
        this.visitVariable(prop);
        if (prop.getter)
            prop.getter = this.visitBlock(prop.getter) || prop.getter;
        if (prop.setter)
            prop.setter = this.visitBlock(prop.setter) || prop.setter;
    }

    protected visitInterface(intf: Interface) {
        this.currentInterface = intf;
        intf.baseInterfaces = intf.baseInterfaces.map(x => this.visitType(x) || x);
        for (const field of intf.fields)
            this.visitField(field);
        for (const method of intf.methods)
            this.visitMethod(method);
        this.currentInterface = null;
    }

    protected visitClass(cls: Class) {
        this.currentInterface = cls;
        if (cls.constructor_)
            this.visitConstructor(cls.constructor_);

        cls.baseClass = this.visitType(cls.baseClass) || cls.baseClass;
        cls.baseInterfaces = cls.baseInterfaces.map(x => this.visitType(x) || x);
        for (const field of cls.fields)
            this.visitField(field);
        for (const prop of cls.properties)
            this.visitProperty(prop);
        for (const method of cls.methods)
            this.visitMethod(method);
        this.currentInterface = null;
    }
 
    protected visitEnum(enum_: Enum) {
        for (const value of enum_.values)
            this.visitEnumMember(value);
    }

    protected visitEnumMember(enumMember: EnumMember) {
    }

    public visitSourceFile(sourceFile: SourceFile): void {
        this.errorMan.resetContext(this);
        this.currentFile = sourceFile;
        for (const enum_ of sourceFile.enums)
            this.visitEnum(enum_);
        for (const intf of sourceFile.interfaces)
            this.visitInterface(intf);
        for (const cls of sourceFile.classes)
            this.visitClass(cls);
        for (const func of sourceFile.funcs)
            this.visitGlobalFunction(func);
        sourceFile.mainBlock = this.visitBlock(sourceFile.mainBlock) || sourceFile.mainBlock;
        this.currentFile = null;
    }

    public visitPackage(pkg: Package) {
        for (const file of Object.values(pkg.files))
            this.visitSourceFile(file);
    }
}