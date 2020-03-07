import { Type, IHasTypeArguments, ClassType, InterfaceType, UnresolvedType, IType, LambdaType } from "./Ast/AstTypes";
import { Identifier, BinaryExpression, ConditionalExpression, NewExpression, TemplateString, ParenthesizedExpression, UnaryExpression, PropertyAccessExpression, ElementAccessExpression, ArrayLiteral, MapLiteral, Expression, CastExpression, UnresolvedCallExpression, InstanceOfExpression, AwaitExpression, StringLiteral, NumericLiteral, NullLiteral, RegexLiteral, BooleanLiteral } from "./Ast/Expressions";
import { ReturnStatement, ExpressionStatement, IfStatement, ThrowStatement, VariableDeclaration, WhileStatement, ForStatement, ForeachStatement, Statement, UnsetStatement, BreakStatement, ContinueStatement, DoStatement } from "./Ast/Statements";
import { Block, Method, Constructor, Field, Property, Interface, Class, Enum, EnumMember, SourceFile, IVariable, IVariableWithInitializer, MethodParameter, Lambda, IMethodBase } from "./Ast/Types";
import { ClassReference, EnumReference, ThisReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, GlobalFunctionReference, StaticMethodReference, SuperReference, InstanceFieldReference, InstancePropertyReference, InstanceMethodReference, StaticPropertyReference, StaticFieldReference } from "./Ast/References";
import { ErrorManager } from "./ErrorManager";

export abstract class AstTransformer<TContext> {
    constructor(public errorMan: ErrorManager = null) {
        if (this.errorMan === null)
            this.errorMan = new ErrorManager();
     }

    protected visitType(type: IType, context: TContext): Type {
        if (type instanceof ClassType || type instanceof InterfaceType || type instanceof UnresolvedType)
            type.typeArguments = type.typeArguments.map(x => this.visitType(x, context) || x);
        else if (type instanceof LambdaType) {
            type.parameters = type.parameters.map(x => this.visitMethodParameter(x, context) || x);
            type.returnType = this.visitType(type.returnType, context) || type.returnType;
        }
        return null;
    }
 
    protected visitIdentifier(id: Identifier, context: TContext): Expression { 
        return null;
    }

    protected visitVariable(variable: IVariable, context: TContext): IVariable {
        if (variable.type)
            variable.type = this.visitType(variable.type, context) || variable.type;
        return null;
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer, context: TContext): IVariableWithInitializer {
        this.visitVariable(variable, context);
        if (variable.initializer)
            variable.initializer = this.visitExpression(variable.initializer, context) || variable.initializer;
        return null;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration, context: TContext): VariableDeclaration {
        this.visitVariableWithInitializer(stmt, context);
        return null;
    }

    protected visitUnknownStatement(stmt: Statement, context: TContext): Statement {
        return this.errorMan.throw(`Unknown statement type: ${stmt.constructor.name}`);
    }

    protected visitStatement(stmt: Statement, context: TContext): Statement {
        if (stmt instanceof ReturnStatement) {
            if (stmt.expression)
                stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        } else if (stmt instanceof ExpressionStatement) {
            stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        } else if (stmt instanceof IfStatement) {
            stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
            stmt.then = this.visitBlock(stmt.then, context) || stmt.then;
            if (stmt.else_)
                stmt.else_ = this.visitBlock(stmt.else_, context) || stmt.else_;
        } else if (stmt instanceof ThrowStatement) {
            stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        } else if (stmt instanceof VariableDeclaration) {
            return this.visitVariableDeclaration(stmt, context);
        } else if (stmt instanceof WhileStatement) {
            stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
            stmt.body = this.visitBlock(stmt.body, context) || stmt.body;    
        } else if (stmt instanceof DoStatement) {
            stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
            stmt.body = this.visitBlock(stmt.body, context) || stmt.body;    
        } else if (stmt instanceof ForStatement) {
            if (stmt.itemVar)
                this.visitVariableWithInitializer(stmt.itemVar, context);
            stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
            stmt.incrementor = this.visitExpression(stmt.incrementor, context) || stmt.incrementor;
            stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
        } else if (stmt instanceof ForeachStatement) {
            this.visitVariable(stmt.itemVar, context);
            stmt.items = this.visitExpression(stmt.items, context) || stmt.items;
            stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
        } else if (stmt instanceof BreakStatement) {
            // ...
        } else if (stmt instanceof UnsetStatement) {
            stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        } else if (stmt instanceof ContinueStatement) {
            // ...
        } else {
            return this.visitUnknownStatement(stmt, context);
        }
        return null;
    }

    protected visitBlock(block: Block, context: TContext): Block {
        block.statements = block.statements.map(x => this.visitStatement(x, context) || x);
        return null;
    }

    protected visitTemplateString(expr: TemplateString, context: TContext): TemplateString {
        for (let i = 0; i < expr.parts.length; i++) {
            const part = expr.parts[i];
            if(!part.isLiteral)
                part.expression = this.visitExpression(part.expression, context) || part.expression;
        }
        return null;
    }
    
    protected visitUnknownExpression(expr: Expression, context: TContext): Expression {
        return this.errorMan.throw(`Unknown expression type: ${expr.constructor.name}`);
    }

    protected visitLambda(lambda: Lambda, context: TContext): Lambda {
        lambda.parameters = lambda.parameters.map(x => this.visitMethodParameter(x, context) || x);
        lambda.body = this.visitBlock(lambda.body, context) || lambda.body;
        return null;
    }

    protected visitExpression(expr: Expression, context: TContext): Expression {
        if (expr instanceof BinaryExpression) {
            expr.left = this.visitExpression(expr.left, context) || expr.left;
            expr.right = this.visitExpression(expr.right, context) || expr.right;
        } else if (expr instanceof UnresolvedCallExpression) {
            expr.method = this.visitExpression(expr.method, context) || expr.method;
            expr.typeArgs = expr.typeArgs.map(x => this.visitType(x, context) || x);
            expr.args = expr.args.map(x => this.visitExpression(x, context) || x);
        } else if (expr instanceof ConditionalExpression) {
            expr.condition = this.visitExpression(expr.condition, context) || expr.condition;
            expr.whenTrue = this.visitExpression(expr.whenTrue, context) || expr.whenTrue;
            expr.whenFalse = this.visitExpression(expr.whenFalse, context) || expr.whenFalse;
        } else if (expr instanceof Identifier) {
            return this.visitIdentifier(expr, context);
        } else if (expr instanceof NewExpression) {
            expr.cls = this.visitType(expr.cls, context) || expr.cls;
            expr.args = expr.args.map(x => this.visitExpression(x, context) || x);
        } else if (expr instanceof TemplateString) {
            return this.visitTemplateString(expr, context);
        } else if (expr instanceof ParenthesizedExpression) {
            expr.expression = this.visitExpression(expr.expression, context) || expr.expression;
        } else if (expr instanceof UnaryExpression) {
            expr.operand = this.visitExpression(expr.operand, context) || expr.operand;
        } else if (expr instanceof PropertyAccessExpression) {
            expr.object = this.visitExpression(expr.object, context) || expr.object;
        } else if (expr instanceof ElementAccessExpression) {
            expr.object = this.visitExpression(expr.object, context) || expr.object;
            expr.elementExpr = this.visitExpression(expr.elementExpr, context) || expr.elementExpr;
        } else if (expr instanceof ArrayLiteral) {
            expr.items = expr.items.map(x => this.visitExpression(x, context) || x);
        } else if (expr instanceof MapLiteral) {
            for (const prop of expr.properties.values())
                this.visitExpression(prop, context);
        } else if (expr instanceof StringLiteral) {
        } else if (expr instanceof BooleanLiteral) {
        } else if (expr instanceof NumericLiteral) {
        } else if (expr instanceof NullLiteral) {
        } else if (expr instanceof RegexLiteral) {
        } else if (expr instanceof CastExpression) {
            expr.newType = this.visitType(expr.newType, context) || expr.newType;
            expr.expression = this.visitExpression(expr.expression, context) || expr.expression;
        } else if (expr instanceof InstanceOfExpression) {
            expr.expr = this.visitExpression(expr.expr, context) || expr.expr;
            expr.checkType = this.visitType(expr.checkType, context) || expr.checkType;
        } else if (expr instanceof AwaitExpression) {
            expr.expr = this.visitExpression(expr.expr, context) || expr.expr;
        } else if (expr instanceof Lambda) {
            return this.visitLambda(expr, context);
        } else if (expr instanceof ClassReference) {
        } else if (expr instanceof EnumReference) {
        } else if (expr instanceof ThisReference) {
        } else if (expr instanceof MethodParameterReference) {
        } else if (expr instanceof VariableDeclarationReference) {
        } else if (expr instanceof ForVariableReference) {
        } else if (expr instanceof ForeachVariableReference) {
        } else if (expr instanceof GlobalFunctionReference) {
        } else if (expr instanceof SuperReference) {
        } else if (expr instanceof InstanceFieldReference) {
        } else if (expr instanceof InstancePropertyReference) {
        } else if (expr instanceof InstanceMethodReference) {
        } else if (expr instanceof StaticFieldReference) {
        } else if (expr instanceof StaticPropertyReference) {
        } else if (expr instanceof StaticMethodReference) {
        } else {
            return this.visitUnknownExpression(expr, context);
        }
    }

    protected visitMethodParameter(methodParameter: MethodParameter, context: TContext) {
        this.visitVariableWithInitializer(methodParameter, context);
        return null;
    }

    protected visitMethodBase(method: IMethodBase, context: TContext) {
        for (const item of method.parameters)
            this.visitMethodParameter(item, context);

        if (method.body)
            method.body = this.visitBlock(method.body, context) || method.body;
    }

    protected visitMethod(method: Method, context: TContext) {
        this.visitMethodBase(method, context);
        method.returns = this.visitType(method.returns, context) || method.returns;
    }
 
    protected visitConstructor(constructor: Constructor, context: TContext) {
        this.visitMethodBase(constructor, context);
    }
 
    protected visitField(field: Field, context: TContext) {
        this.visitVariableWithInitializer(field, context);
    }
 
    protected visitProperty(prop: Property, context: TContext) {
        this.visitVariable(prop, context);
        if (prop.getter)
            prop.getter = this.visitBlock(prop.getter, context) || prop.getter;
        if (prop.setter)
            prop.setter = this.visitBlock(prop.setter, context) || prop.setter;
    }

    protected visitObjectMap<T>(obj: Map<string, T>, visitor: (T) => void) {
        for (const item of obj.values())
            visitor(item);
    }

    protected visitInterface(intf: Interface, context: TContext) {
        intf.baseInterfaces = intf.baseInterfaces.map(x => this.visitType(x, context) || x);
        this.visitObjectMap(intf.methods, x => this.visitMethod(x, context));
    }

    protected visitClass(cls: Class, context: TContext) {
        if (cls.constructor_)
            this.visitConstructor(cls.constructor_, context);

        cls.baseClass = this.visitType(cls.baseClass, context) || cls.baseClass;
        cls.baseInterfaces = cls.baseInterfaces.map(x => this.visitType(x, context) || x);
        this.visitObjectMap(cls.methods, x => this.visitMethod(x, context));
        this.visitObjectMap(cls.properties, x => this.visitProperty(x, context));
        this.visitObjectMap(cls.fields, x => this.visitField(x, context));
    }
 
    protected visitEnum(enum_: Enum, context: TContext) {
        this.visitObjectMap(enum_.values, x => this.visitEnumMember(x, context));
    }

    protected visitEnumMember(enumMember: EnumMember, context: TContext) {
    }

    public visitSourceFile(sourceFile: SourceFile, context: TContext) {
        this.visitObjectMap(sourceFile.enums, x => this.visitEnum(x, context));
        this.visitObjectMap(sourceFile.interfaces, x => this.visitInterface(x, context));
        this.visitObjectMap(sourceFile.classes, x => this.visitClass(x, context));
        sourceFile.mainBlock = this.visitBlock(sourceFile.mainBlock, context) || sourceFile.mainBlock;
        return null;
    }
}