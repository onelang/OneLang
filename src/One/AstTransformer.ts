import { Type, IHasTypeArguments, ClassType, InterfaceType, UnresolvedType, IType } from "./Ast/AstTypes";
import { Identifier, BinaryExpression, ConditionalExpression, NewExpression, Literal, TemplateString, ParenthesizedExpression, UnaryExpression, PropertyAccessExpression, ElementAccessExpression, ArrayLiteral, MapLiteral, Expression, CastExpression, UnresolvedCallExpression } from "./Ast/Expressions";
import { ReturnStatement, ExpressionStatement, IfStatement, ThrowStatement, VariableDeclaration, WhileStatement, ForStatement, ForeachStatement, Statement, UnsetStatement, BreakStatement } from "./Ast/Statements";
import { Block, Method, Constructor, Field, Property, Interface, Class, Enum, EnumMember, SourceFile, IVariable, IVariableWithInitializer, MethodParameter } from "./Ast/Types";

export abstract class AstTransformer<TContext> {
    protected log(data: any) {
        const thisClassName = (<any>this).constructor.name;
        console.log(`[${thisClassName}]`, data);
    }

    protected visitType(type: IType, context: TContext): Type|void {
        if (type instanceof ClassType || type instanceof InterfaceType || type instanceof UnresolvedType)
            type.typeArguments = type.typeArguments.map(x => this.visitType(x, context) || x);
    }
 
    protected visitIdentifier(id: Identifier, context: TContext): Identifier|void { }

    protected visitReturnStatement(stmt: ReturnStatement, context: TContext): ReturnStatement|void {
        if (stmt.expression)
            stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
    }

    protected visitExpressionStatement(stmt: ExpressionStatement, context: TContext): ExpressionStatement|void {
        stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
    }

    protected visitIfStatement(stmt: IfStatement, context: TContext): IfStatement|void {
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.then = this.visitBlock(stmt.then, context) || stmt.then;
        if (stmt.else)
            stmt.else = this.visitBlock(stmt.else, context) || stmt.else;
    }

    protected visitThrowStatement(stmt: ThrowStatement, context: TContext): ThrowStatement|void {
        stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
    }

    protected visitVariable(variable: IVariable, context: TContext): IVariable|void {
        if (variable.type)
            variable.type = this.visitType(variable.type, context) || variable.type;
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer, context: TContext): IVariableWithInitializer|void {
        this.visitVariable(variable, context);
        if (variable.initializer)
            variable.initializer = this.visitExpression(variable.initializer, context) || variable.initializer;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration, context: TContext): VariableDeclaration|void {
        this.visitVariableWithInitializer(stmt, context);
    }

    protected visitWhileStatement(stmt: WhileStatement, context: TContext): WhileStatement|void {
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
    }

    protected visitForStatement(stmt: ForStatement, context: TContext): ForStatement|void {
        stmt.itemVar = this.visitVariableWithInitializer(stmt.itemVar, context) || stmt.itemVar;
        stmt.condition = this.visitExpression(stmt.condition, context) || stmt.condition;
        stmt.incrementor = this.visitExpression(stmt.incrementor, context) || stmt.incrementor;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
    }

    protected visitForeachStatement(stmt: ForeachStatement, context: TContext): ForeachStatement|void {
        stmt.itemVar = this.visitVariable(stmt.itemVar, context) || stmt.itemVar;
        stmt.items = this.visitExpression(stmt.items, context) || stmt.items;
        stmt.body = this.visitBlock(stmt.body, context) || stmt.body;
    }

    protected visitBreakStatement(stmt: BreakStatement, context: TContext): BreakStatement|void { }

    protected visitUnsetStatement(stmt: UnsetStatement, context: TContext): UnsetStatement|void { 
        stmt.expression = this.visitExpression(stmt.expression, context) || stmt.expression;
    }

    protected visitUnknownStatement(stmt: Statement, context: TContext): Statement|void {
        this.log(`Unknown statement type: ${stmt.constructor.name}`);
    }

    protected visitStatement(stmt: Statement, context: TContext): Statement|void {
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
        } else {
            return this.visitUnknownStatement(stmt, context);
        }
    }

    protected visitBlock(block: Block, context: TContext): Block|void {
        block.statements = block.statements.map(x => this.visitStatement(x, context) || x);
    }

    protected visitBinaryExpression(expr: BinaryExpression, context: TContext): BinaryExpression|void {
        expr.left = this.visitExpression(expr.left, context) || expr.left;
        expr.right = this.visitExpression(expr.right, context) || expr.right;
    }

    protected visitCallExpression(expr: UnresolvedCallExpression, context: TContext): UnresolvedCallExpression|void {
        expr.method = this.visitExpression(expr.method, context) || expr.method;
        expr.args = expr.args.map(x => this.visitExpression(x, context) || x);
    }

    protected visitConditionalExpression(expr: ConditionalExpression, context: TContext): ConditionalExpression|void {
        expr.condition = this.visitExpression(expr.condition, context) || expr.condition;
        expr.whenTrue = this.visitExpression(expr.whenTrue, context) || expr.whenTrue;
        expr.whenFalse = this.visitExpression(expr.whenFalse, context) || expr.whenFalse;
    }

    protected visitNewExpression(expr: NewExpression, context: TContext): NewExpression|void {
        expr.cls = this.visitType(expr.cls, context) || expr.cls;
        expr.args = expr.args.map(x => this.visitExpression(x, context) || x);
    }

    protected visitLiteral(expr: Literal, context: TContext): Literal|void { }

    protected visitTemplateString(expr: TemplateString, context: TContext): TemplateString|void {
        for (let i = 0; i < expr.parts.length; i++) {
            const part = expr.parts[i];
            if(!part.isLiteral)
                part.expression = this.visitExpression(part.expression, context) || part.expression;
        }
    }
    
    protected visitParenthesizedExpression(expr: ParenthesizedExpression, context: TContext): ParenthesizedExpression|void {
        expr.expression = this.visitExpression(expr.expression, context) || expr.expression;
    }

    protected visitUnaryExpression(expr: UnaryExpression, context: TContext): UnaryExpression|void {
        expr.operand = this.visitExpression(expr.operand, context) || expr.operand;
    }

    protected visitPropertyAccessExpression(expr: PropertyAccessExpression, context: TContext): PropertyAccessExpression|void {
        expr.object = this.visitExpression(expr.object, context) || expr.object;
    }

    protected visitElementAccessExpression(expr: ElementAccessExpression, context: TContext): ElementAccessExpression|void {
        expr.object = this.visitExpression(expr.object, context) || expr.object;
        expr.elementExpr = this.visitExpression(expr.elementExpr, context) || expr.elementExpr;
    }

    protected visitArrayLiteral(expr: ArrayLiteral, context: TContext): ArrayLiteral|void {
        expr.items = expr.items.map(x => this.visitExpression(x, context) || x);
    }

    protected visitMapLiteral(expr: MapLiteral, context: TContext): MapLiteral|void {
        this.convertObjectMap(expr.properties, x => this.visitExpression(x, context));
    }

    protected visitUnknownExpression(expr: Expression, context: TContext): Expression|void {
        this.log(`Unknown expression type: ${expr.constructor.name}`);
    }

    // protected visitVariableRef(expr: VariableRef, context: TContext) {
    //     if (expr.thisExpr)
    //         this.visitExpression(expr.thisExpr, context);
    // }

    // protected visitMethodReference(expr: MethodReference, context: TContext) {
    //     if (expr.thisExpr)
    //         this.visitExpression(expr.thisExpr, context);
    // }

    // protected visitClassReference(expr: ClassReference, context: TContext) { }

    // protected visitThisReference(expr: ThisReference, context: TContext) { }

    // protected visitEnumReference(expr: EnumReference, context: TContext) { }

    // protected visitEnumMemberReference(expr: EnumReference, context: TContext) { }

    protected visitCastExpression(expr: CastExpression, context: TContext): CastExpression|void { 
        expr.expression = this.visitExpression(expr.expression, context) || expr.expression;
    }

    protected visitExpression(expression: Expression, context: TContext): Expression|void {
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
        // } else if (expression instanceof VariableReference) {
        //     return this.visitVariableRef(<VariableRef> expression, context);
        // } else if (expression instanceof MethodReference) {
        //     return this.visitMethodReference(<MethodReference> expression, context);
        // } else if (expression instanceof ClassReference) {
        //     return this.visitClassReference(<ClassReference> expression, context);
        // } else if (expression instanceof ThisReference) {
        //     return this.visitThisReference(<ThisReference> expression, context);
        // } else if (expression instanceof EnumReference) {
        //     return this.visitEnumReference(<EnumReference> expression, context);
        // } else if (expression instanceof EnumMemberReference) {
        //     return this.visitEnumMemberReference(<EnumMemberReference> expression, context);
        } else {
            return this.visitUnknownExpression(expression, context);
        }
    }

    protected visitMethodParameter(methodParameter: MethodParameter, context: TContext): MethodParameter|void {
        this.visitVariableWithInitializer(methodParameter, context);
    }

    protected visitMethod(method: Method, context: TContext): Method|void {
        if (method.body)
            method.body = this.visitBlock(method.body, context) || method.body;

        method.parameters = method.parameters.map(x => this.visitMethodParameter(x, context) || x);

        method.returns = this.visitType(method.returns, context) || method.returns;
    }
 
    protected visitConstructor(constructor: Constructor, context: TContext): Constructor|void {
        if (constructor.body)
            constructor.body = this.visitBlock(constructor.body, context) || constructor.body;

        constructor.parameters = constructor.parameters.map(x => this.visitMethodParameter(x, context) || x);
    }
 
    protected visitField(field: Field, context: TContext): Field|void {
        this.visitVariableWithInitializer(field, context);
    }
 
    protected visitProperty(prop: Property, context: TContext): Property|void {
        this.visitVariable(prop, context);
        prop.getter = this.visitBlock(prop.getter, context) || prop.getter;
        prop.setter = this.visitBlock(prop.setter, context) || prop.setter;
    }

    protected convertObjectMap<T>(obj: { [name: string]: T }, converter: (T) => T|void) {
        for (const name of Object.keys(obj)) {
            const newValue = converter(obj[name]);
            if (newValue)
                obj[name] = newValue;
        }
    }

    protected visitInterface(intf: Interface, context: TContext): Interface|void {
        this.convertObjectMap(intf.methods, x => this.visitMethod(x, context));
    }

    protected visitClass(cls: Class, context: TContext): Class|void {
        if (cls.constructor_)
            cls.constructor_ = this.visitConstructor(cls.constructor_, context) || cls.constructor_;

        this.convertObjectMap(cls.methods, x => this.visitMethod(x, context));
        this.convertObjectMap(cls.properties, x => this.visitProperty(x, context));
        this.convertObjectMap(cls.fields, x => this.visitField(x, context));
    }
 
    protected visitEnum(enum_: Enum, context: TContext): Enum|void {
        enum_.values = enum_.values.map(x => this.visitEnumMember(x, context) || x);
    }

    protected visitEnumMember(enumMember: EnumMember, context: TContext): EnumMember|void {
    }

    public visitSourceFile(sourceFile: SourceFile, context: TContext): SourceFile|void {
        this.convertObjectMap(sourceFile.enums, x => this.visitEnum(x, context));
        this.convertObjectMap(sourceFile.interfaces, x => this.visitInterface(x, context));
        this.convertObjectMap(sourceFile.classes, x => this.visitClass(x, context));
        sourceFile.mainBlock = this.visitBlock(sourceFile.mainBlock, context) || sourceFile.mainBlock;
    }
}