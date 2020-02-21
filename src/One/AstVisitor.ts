import { Type, IHasTypeArguments, ClassType, InterfaceType } from "./Ast/AstTypes";
import { Identifier, BinaryExpression, CallExpression, ConditionalExpression, NewExpression, Literal, TemplateString, ParenthesizedExpression, UnaryExpression, PropertyAccessExpression, ElementAccessExpression, ArrayLiteral, MapLiteral, Expression, CastExpression } from "./Ast/Expressions";
import { ReturnStatement, ExpressionStatement, IfStatement, ThrowStatement, VariableDeclaration, WhileStatement, ForStatement, ForeachStatement, Statement, UnsetStatement, BreakStatement } from "./Ast/Statements";
import { Block, Method, Constructor, Field, Property, Interface, Class, Enum, EnumMember, SourceFile, IVariable, IVariableWithInitializer } from "./Ast/Types";

export abstract class AstVisitor<TContext> {
    protected log(data: any) {
        const thisClassName = (<any>this).constructor.name;
        console.log(`[${thisClassName}]`, data);
    }

    protected visitType(type: Type, context: TContext) {
        if (type instanceof ClassType || type instanceof InterfaceType)
            for (const typeArg of type.typeArguments)
                this.visitType(typeArg, context);
    }
 
    protected visitIdentifier(id: Identifier, context: TContext) { }

    protected visitReturnStatement(stmt: ReturnStatement, context: TContext) {
        if (stmt.expression)
            this.visitExpression(stmt.expression, context);
    }

    protected visitExpressionStatement(stmt: ExpressionStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitIfStatement(stmt: IfStatement, context: TContext) {
        this.visitExpression(stmt.condition, context);
        this.visitBlock(stmt.then, context);
        if (stmt.else)
            this.visitBlock(stmt.else, context);
    }

    protected visitThrowStatement(stmt: ThrowStatement, context: TContext) {
        this.visitExpression(stmt.expression, context);
    }

    protected visitVariable(variable: IVariable, context: TContext) {
        this.visitType(variable.type, context);
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer, context: TContext) {
        this.visitVariable(variable, context);
        if (variable.initializer)
            this.visitExpression(variable.initializer, context);
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration, context: TContext) {
        this.visitVariableWithInitializer(stmt, context);
    }

    protected visitWhileStatement(stmt: WhileStatement, context: TContext) {
        this.visitExpression(stmt.condition, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitForStatement(stmt: ForStatement, context: TContext) {
        this.visitVariableWithInitializer(stmt.itemVar, context);
        this.visitExpression(stmt.condition, context);
        this.visitExpression(stmt.incrementor, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitForeachStatement(stmt: ForeachStatement, context: TContext) {
        this.visitVariable(stmt.itemVar, context);
        this.visitExpression(stmt.items, context);
        this.visitBlock(stmt.body, context);
    }

    protected visitBreakStatement(stmt: BreakStatement, context: TContext) { }

    protected visitUnsetStatement(stmt: UnsetStatement, context: TContext) { 
        this.visitExpression(stmt.expression, context);
    }

    protected visitUnknownStatement(stmt: Statement, context: TContext) {
        this.log(`Unknown statement type: ${stmt.constructor.name}`);
    }

    protected visitStatement(stmt: Statement, context: TContext) {
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

    protected visitBlock(block: Block, context: TContext) {
        for (const statement of block.statements) {
            this.visitStatement(statement, context);
        }
    }

    protected visitBinaryExpression(expr: BinaryExpression, context: TContext) {
        this.visitExpression(expr.left, context);
        this.visitExpression(expr.right, context);
    }

    protected visitCallExpression(expr: CallExpression, context: TContext) {
        this.visitExpression(expr.method, context);
        for (const arg of expr.args)
            this.visitExpression(arg, context);
    }

    protected visitConditionalExpression(expr: ConditionalExpression, context: TContext) {
        this.visitExpression(expr.condition, context);
        this.visitExpression(expr.whenTrue, context);
        this.visitExpression(expr.whenFalse, context);
    }

    protected visitNewExpression(expr: NewExpression, context: TContext) {
        this.visitType(expr.cls, context);
        for (const arg of expr.args)
            this.visitExpression(arg, context);
    }

    protected visitLiteral(expr: Literal, context: TContext) { }

    protected visitTemplateString(expr: TemplateString, context: TContext) {
        for (const part of expr.parts.filter(x => x.expression))
            this.visitExpression(part.expression, context);
    }
    
    protected visitParenthesizedExpression(expr: ParenthesizedExpression, context: TContext) {
        this.visitExpression(expr.expression, context);
    }

    protected visitUnaryExpression(expr: UnaryExpression, context: TContext) {
        this.visitExpression(expr.operand, context);
    }

    protected visitPropertyAccessExpression(expr: PropertyAccessExpression, context: TContext) {
        this.visitExpression(expr.object, context);
    }

    protected visitElementAccessExpression(expr: ElementAccessExpression, context: TContext) {
        this.visitExpression(expr.object, context);
        this.visitExpression(expr.elementExpr, context);
    }

    protected visitArrayLiteral(expr: ArrayLiteral, context: TContext) {
        for (const item of expr.items)
            this.visitExpression(item, context);
    }

    protected visitMapLiteral(expr: MapLiteral, context: TContext) {
        for (const propValue of Object.values(expr.properties))
            this.visitExpression(propValue, context);
    }

    protected visitUnknownExpression(expr: Expression, context: TContext) {
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

    protected visitCastExpression(expr: CastExpression, context: TContext) { 
        this.visitExpression(expr.expression, context);
    }

    protected visitExpression(expression: Expression, context: TContext) {
        if (expression instanceof BinaryExpression) {
            return this.visitBinaryExpression(expression, context);
        } else if (expression instanceof CallExpression) {
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

    protected visitMethod(method: Method, context: TContext) {
        if (method.body)
            this.visitBlock(method.body, context);

        for (const param of method.parameters)
            this.visitVariableWithInitializer(param, context);

        this.visitType(method.returns, context);
    }
 
    protected visitConstructor(constructor: Constructor, context: TContext) {
        if (constructor.body)
            this.visitBlock(constructor.body, context);

        for (const param of constructor.parameters)
            this.visitVariableWithInitializer(param, context);
    }
 
    protected visitField(field: Field, context: TContext) {
        this.visitVariableWithInitializer(field, context);
    }
 
    protected visitProperty(prop: Property, context: TContext) {
        this.visitVariable(prop, context);
        this.visitBlock(prop.getter, context);
        this.visitBlock(prop.setter, context);
    }

    protected visitInterface(intf: Interface, context: TContext) {
        for (const method of Object.values(intf.methods))
            this.visitMethod(method, context);
    }
 
    protected visitClass(cls: Class, context: TContext) {
        if (cls.constructor_)
            this.visitConstructor(cls.constructor_, context);

        for (const method of Object.values(cls.methods))
            this.visitMethod(method, context);

        for (const prop of Object.values(cls.properties))
            this.visitProperty(prop, context);

        for (const field of Object.values(cls.fields))
            this.visitField(field, context);
    }
 
    protected visitEnum(enum_: Enum, context: TContext) { 
        for (var item of enum_.values)
            this.visitEnumMember(item, context);
    }

    protected visitEnumMember(enumMember: EnumMember, context: TContext) {
    }

    protected visitSourceFile(sourceFile: SourceFile, context: TContext) {
        for (const enum_ of Object.values(sourceFile.enums))
            this.visitEnum(enum_, context);

        for (const intf of Object.values(sourceFile.interfaces))
            this.visitInterface(intf, context);

        for (const cls of Object.values(sourceFile.classes))
            this.visitClass(cls, context);

        this.visitBlock(sourceFile.mainBlock, context);
    }
}