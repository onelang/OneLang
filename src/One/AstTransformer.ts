import { Type, IHasTypeArguments, ClassType, InterfaceType, UnresolvedType, IType } from "./Ast/AstTypes";
import { Identifier, BinaryExpression, ConditionalExpression, NewExpression, Literal, TemplateString, ParenthesizedExpression, UnaryExpression, PropertyAccessExpression, ElementAccessExpression, ArrayLiteral, MapLiteral, Expression, CastExpression, UnresolvedCallExpression, InstanceOfExpression } from "./Ast/Expressions";
import { ReturnStatement, ExpressionStatement, IfStatement, ThrowStatement, VariableDeclaration, WhileStatement, ForStatement, ForeachStatement, Statement, UnsetStatement, BreakStatement, ContinueStatement, DoStatement } from "./Ast/Statements";
import { Block, Method, Constructor, Field, Property, Interface, Class, Enum, EnumMember, SourceFile, IVariable, IVariableWithInitializer, MethodParameter, Lambda } from "./Ast/Types";

export abstract class AstTransformer<TContext> {
    protected log(data: any) {
        const thisClassName = (<any>this).constructor.name;
        console.log(`[${thisClassName}]`, data);
    }

    protected visitType(type: IType, context: TContext): Type {
        if (type instanceof ClassType || type instanceof InterfaceType || type instanceof UnresolvedType)
            type.typeArguments = type.typeArguments.map(x => this.visitType(x, context) || x);
        return null;
    }
 
    protected visitIdentifier(id: Identifier, context: TContext): Identifier { 
        return null;
    }

    protected visitReturnStatement(stmt: ReturnStatement, context: TContext): ReturnStatement {
        if (stmt.expression)
            stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        return null;
    }

    protected visitExpressionStatement(stmt: ExpressionStatement, context: TContext): ExpressionStatement {
        stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        return null;
    }

    protected visitIfStatement(stmt: IfStatement, context: TContext): IfStatement {
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.then = this.visitBlock(stmt.then, context) || stmt.then;
        if (stmt.else)
            stmt.else = this.visitBlock(stmt.else, context) || stmt.else;
        return null;
    }

    protected visitThrowStatement(stmt: ThrowStatement, context: TContext): ThrowStatement {
        stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
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

    protected visitWhileStatement(stmt: WhileStatement, context: TContext): WhileStatement {
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
        return null;
    }

    protected visitDoStatement(stmt: DoStatement, context: TContext): DoStatement {
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
        return null;
    }

    protected visitForStatement(stmt: ForStatement, context: TContext): ForStatement {
        if (stmt.itemVar)
            stmt.itemVar = this.visitVariableWithInitializer(stmt.itemVar, context) || stmt.itemVar;
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.incrementor = this.visitExpression(stmt.incrementor, context) || stmt.incrementor;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
        return null;
    }

    protected visitForeachStatement(stmt: ForeachStatement, context: TContext): ForeachStatement {
        stmt.itemVar = this.visitVariable(stmt.itemVar, context) || stmt.itemVar;
        stmt.items = this.visitExpression(stmt.items, context) || stmt.items;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
        return null;
    }

    protected visitBreakStatement(stmt: BreakStatement, context: TContext): BreakStatement {
        return null;
    }

    protected visitUnsetStatement(stmt: UnsetStatement, context: TContext): UnsetStatement { 
        stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
        return null;
    }

    protected visitContinueStatement(stmt: ContinueStatement, context: TContext): ContinueStatement { 
        return null;
    }

    protected visitUnknownStatement(stmt: Statement, context: TContext): Statement {
        this.log(`Unknown statement type: ${stmt.constructor.name}`);
        return null;
    }

    protected visitStatement(stmt: Statement, context: TContext): Statement {
        if (stmt instanceof ReturnStatement) {
            return this.visitReturnStatement(stmt, context);
        } else if (stmt instanceof ExpressionStatement) {
            return this.visitExpressionStatement(stmt, context);
        } else if (stmt instanceof IfStatement) {
            return this.visitIfStatement(stmt, context);
        } else if (stmt instanceof ThrowStatement) {
            return this.visitThrowStatement(stmt, context);
        } else if (stmt instanceof VariableDeclaration) {
            return this.visitVariableDeclaration(stmt, context);
        } else if (stmt instanceof WhileStatement) {
            return this.visitWhileStatement(stmt, context);
        } else if (stmt instanceof ForStatement) {
            return this.visitForStatement(stmt, context);
        } else if (stmt instanceof ForeachStatement) {
            return this.visitForeachStatement(stmt, context);
        } else if (stmt instanceof BreakStatement) {
            return this.visitBreakStatement(stmt, context);
        } else if (stmt instanceof UnsetStatement) {
            return this.visitUnsetStatement(stmt, context);
        } else if (stmt instanceof ContinueStatement) {
            return this.visitContinueStatement(stmt, context);
        } else if (stmt instanceof DoStatement) {
            return this.visitDoStatement(stmt, context);
        } else {
            return this.visitUnknownStatement(stmt, context);
        }
    }

    protected visitBlock(block: Block, context: TContext): Block {
        block.statements = block.statements.map(x => this.visitStatement(x, context) || x);
        return null;
    }

    protected visitBinaryExpression(expr: BinaryExpression, context: TContext): BinaryExpression {
        expr.left = this.visitExpression(expr.left, context) || expr.left;
        expr.right = this.visitExpression(expr.right, context) || expr.right;
        return null;
    }

    protected visitCallExpression(expr: UnresolvedCallExpression, context: TContext): UnresolvedCallExpression {
        expr.method = this.visitExpression(expr.method, context) || expr.method;
        expr.args = expr.args.map(x => this.visitExpression(x, context) || x);
        return null;
    }

    protected visitConditionalExpression(expr: ConditionalExpression, context: TContext): ConditionalExpression {
        expr.condition = this.visitExpression(expr.condition, context) || expr.condition;
        expr.whenTrue = this.visitExpression(expr.whenTrue, context) || expr.whenTrue;
        expr.whenFalse = this.visitExpression(expr.whenFalse, context) || expr.whenFalse;
        return null;
    }

    protected visitNewExpression(expr: NewExpression, context: TContext): NewExpression {
        expr.cls = this.visitType(expr.cls, context) || expr.cls;
        expr.args = expr.args.map(x => this.visitExpression(x, context) || x);
        return null;
    }

    protected visitLiteral(expr: Literal, context: TContext): Literal {
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
    
    protected visitParenthesizedExpression(expr: ParenthesizedExpression, context: TContext): ParenthesizedExpression {
        expr.expression = this.visitExpression(expr.expression, context) || expr.expression;
        return null;
    }

    protected visitUnaryExpression(expr: UnaryExpression, context: TContext): UnaryExpression {
        expr.operand = this.visitExpression(expr.operand, context) || expr.operand;
        return null;
    }

    protected visitPropertyAccessExpression(expr: PropertyAccessExpression, context: TContext): PropertyAccessExpression {
        expr.object = this.visitExpression(expr.object, context) || expr.object;
        return null;
    }

    protected visitElementAccessExpression(expr: ElementAccessExpression, context: TContext): ElementAccessExpression {
        expr.object = this.visitExpression(expr.object, context) || expr.object;
        expr.elementExpr = this.visitExpression(expr.elementExpr, context) || expr.elementExpr;
        return null;
    }

    protected visitArrayLiteral(expr: ArrayLiteral, context: TContext): ArrayLiteral {
        expr.items = expr.items.map(x => this.visitExpression(x, context) || x);
        return null;
    }

    protected visitMapLiteral(expr: MapLiteral, context: TContext): MapLiteral {
        this.convertObjectMap(expr.properties, x => this.visitExpression(x, context));
        return null;
    }

    protected visitUnknownExpression(expr: Expression, context: TContext): Expression {
        this.log(`Unknown expression type: ${expr.constructor.name}`);
        return null;
    }

    protected visitCastExpression(expr: CastExpression, context: TContext): CastExpression { 
        expr.expression = this.visitExpression(expr.expression, context) || expr.expression;
        return null;
    }

    protected visitInstanceOfExpression(expr: InstanceOfExpression, context: TContext): InstanceOfExpression { 
        expr.expr = this.visitExpression(expr.expr, context) || expr.expr;
        expr.type = this.visitType(expr.type, context) || expr.type;
        return null;
    }

    protected visitLambda(lambda: Lambda, context: TContext): Lambda {
        lambda.parameters = lambda.parameters.map(x => this.visitMethodParameter(x, context) || x);
        lambda.body = this.visitBlock(lambda.body, context) || lambda.body;
        return null;
    }

    protected visitExpression(expression: Expression, context: TContext): Expression {
        if (expression instanceof BinaryExpression) {
            return this.visitBinaryExpression(expression, context);
        } else if (expression instanceof UnresolvedCallExpression) {
            return this.visitCallExpression(expression, context);
        } else if (expression instanceof ConditionalExpression) {
            return this.visitConditionalExpression(expression, context);
        } else if (expression instanceof Identifier) {
            return this.visitIdentifier(expression, context);
        } else if (expression instanceof NewExpression) {
            return this.visitNewExpression(expression, context);
        } else if (expression instanceof Literal) {
            return this.visitLiteral(expression, context);
        } else if (expression instanceof TemplateString) {
            return this.visitTemplateString(expression, context);
        } else if (expression instanceof ParenthesizedExpression) {
            return this.visitParenthesizedExpression(expression, context);
        } else if (expression instanceof UnaryExpression) {
            return this.visitUnaryExpression(expression, context);
        } else if (expression instanceof PropertyAccessExpression) {
            return this.visitPropertyAccessExpression(expression, context);
        } else if (expression instanceof ElementAccessExpression) {
            return this.visitElementAccessExpression(expression, context);
        } else if (expression instanceof ArrayLiteral) {
            return this.visitArrayLiteral(expression, context);
        } else if (expression instanceof MapLiteral) {
            return this.visitMapLiteral(expression, context);
        } else if (expression instanceof CastExpression) {
            return this.visitCastExpression(expression, context);
        } else if (expression instanceof InstanceOfExpression) {
            return this.visitInstanceOfExpression(expression, context);
        } else if (expression instanceof Lambda) {
            return this.visitLambda(expression, context);
        } else {
            return this.visitUnknownExpression(expression, context);
        }
    }

    protected visitMethodParameter(methodParameter: MethodParameter, context: TContext): MethodParameter {
        this.visitVariableWithInitializer(methodParameter, context);
        return null;
    }

    protected visitMethod(method: Method, context: TContext): Method {
        if (method.body)
            method.body = this.visitBlock(method.body, context) || method.body;

        method.parameters = method.parameters.map(x => this.visitMethodParameter(x, context) || x);

        method.returns = this.visitType(method.returns, context) || method.returns;
        return null;
    }
 
    protected visitConstructor(constructor: Constructor, context: TContext): Constructor {
        if (constructor.body)
            constructor.body = this.visitBlock(constructor.body, context) || constructor.body;

        constructor.parameters = constructor.parameters.map(x => this.visitMethodParameter(x, context) || x);
        return null;
    }
 
    protected visitField(field: Field, context: TContext): Field {
        this.visitVariableWithInitializer(field, context);
        return null;
    }
 
    protected visitProperty(prop: Property, context: TContext): Property {
        this.visitVariable(prop, context);
        prop.getter = this.visitBlock(prop.getter, context) || prop.getter;
        prop.setter = this.visitBlock(prop.setter, context) || prop.setter;
        return null;
    }

    protected convertObjectMap<T>(obj: { [name: string]: T }, converter: (T) => T) {
        for (const name of Object.keys(obj)) {
            const newValue = converter(obj[name]);
            if (newValue)
                obj[name] = newValue;
        }
    }

    protected visitInterface(intf: Interface, context: TContext): Interface {
        this.convertObjectMap(intf.methods, x => this.visitMethod(x, context));
        return null;
    }

    protected visitClass(cls: Class, context: TContext): Class {
        if (cls.constructor_)
            cls.constructor_ = this.visitConstructor(cls.constructor_, context) || cls.constructor_;

        this.convertObjectMap(cls.methods, x => this.visitMethod(x, context));
        this.convertObjectMap(cls.properties, x => this.visitProperty(x, context));
        this.convertObjectMap(cls.fields, x => this.visitField(x, context));
        return null;
    }
 
    protected visitEnum(enum_: Enum, context: TContext): Enum {
        enum_.values = enum_.values.map(x => this.visitEnumMember(x, context) || x);
        return null;
    }

    protected visitEnumMember(enumMember: EnumMember, context: TContext): EnumMember {
        return null;
    }

    public visitSourceFile(sourceFile: SourceFile, context: TContext): SourceFile {
        this.convertObjectMap(sourceFile.enums, x => this.visitEnum(x, context));
        this.convertObjectMap(sourceFile.interfaces, x => this.visitInterface(x, context));
        this.convertObjectMap(sourceFile.classes, x => this.visitClass(x, context));
        sourceFile.mainBlock = this.visitBlock(sourceFile.mainBlock, context) || sourceFile.mainBlock;
        return null;
    }
}