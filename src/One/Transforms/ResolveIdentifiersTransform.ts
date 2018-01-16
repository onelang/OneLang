import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { SchemaContext } from "../SchemaContext";
import { ISchemaTransform } from "../SchemaTransformer";
import { VariableContext } from "../VariableContext";
import { AstHelper } from "../AstHelper";
import { AstTransformer } from "../AstTransformer";

export class Context {
    variables: VariableContext<one.Reference> = null;

    constructor(parent: Context = null) {
        this.variables = parent === null ? new VariableContext() : parent.variables.inherit();
    }

    addLocalVar(variable: one.VariableBase) {
        this.variables.add(variable.name, one.VariableRef.MethodVariable(variable));
    }

    inherit() {
        return new Context(this);
    }
}

export class ResolveIdentifiersTransform extends AstTransformer<Context> {
    constructor(public schemaCtx: SchemaContext) { super(); }

    protected visitIdentifier(id: one.Identifier, context: Context) {
        const variable = context.variables.get(id.text);
        const cls = this.schemaCtx.getClass(id.text);
        const enum_ = this.schemaCtx.schema.enums[id.text];
        if (variable) {
            AstHelper.replaceProperties(id, variable);
        } else if (cls) {
            AstHelper.replaceProperties(id, new one.ClassReference(cls));
        } else if (enum_) {
            AstHelper.replaceProperties(id, new one.EnumReference(enum_));
        } else {
            this.log(`Could not find identifier: ${id.text}`);
        }
    }

    protected visitVariable(stmt: one.VariableDeclaration, context: Context) { 
        super.visitVariable(stmt, context); 
        context.addLocalVar(stmt); 
    }

    protected visitForStatement(stmt: one.ForStatement, context: Context) { 
        this.visitExpression(stmt.itemVariable.initializer, context); 
         
        const newContext = context.inherit(); 
        newContext.addLocalVar(stmt.itemVariable); 
 
        this.visitExpression(stmt.condition, newContext); 
        this.visitExpression(stmt.incrementor, newContext); 
        this.visitBlock(stmt.body, newContext); 
    }

    protected visitForeachStatement(stmt: one.ForeachStatement, context: Context) { 
        this.visitExpression(stmt.items, context); 
             
        const newContext = context.inherit(); 
        newContext.addLocalVar(stmt.itemVariable); 
    
        this.visitBlock(stmt.body, newContext); 
    }

    protected tryToConvertImplicitVarDecl(stmt: one.ExpressionStatement, context: Context) {
        if (stmt.expression.exprKind !== one.ExpressionKind.Binary) return false;        
        const expr = <one.BinaryExpression> stmt.expression;        
        if (expr.operator !== "=" || expr.left.exprKind !== one.ExpressionKind.Identifier) return false;
        const name = (<one.Identifier> expr.left).text;
        if (context.variables.get(name) !== null) return false;

        const varDecl = AstHelper.replaceProperties(stmt, <one.VariableDeclaration> { 
            stmtType: one.StatementType.VariableDeclaration,
            name,
            initializer: expr.right,
        });
        this.visitVariableDeclaration(varDecl, context);
        return true;
    }

    protected visitExpressionStatement(stmt: one.ExpressionStatement, context: Context) {
        if (this.schemaCtx.schema.langData.allowImplicitVariableDeclaration && this.tryToConvertImplicitVarDecl(stmt, context))
            return;

        this.visitExpression(stmt.expression, context);
    }

    protected visitMethodLike(method: one.Method|one.Constructor, classContext: Context) {
        const methodContext = classContext.inherit();

        for (const param of method.parameters)
            methodContext.variables.add(param.name, one.VariableRef.MethodArgument(param));
        
        if (method.body)
            this.visitBlock(method.body, methodContext);
    }

    protected visitClass(cls: one.Class, globalContext: Context) {
        const classContext = globalContext.inherit();
        classContext.variables.add("this", new one.ThisReference());
        super.visitClass(cls, classContext);
    }
        
    static transform(schemaCtx: SchemaContext) {
        const globalContext = schemaCtx.tiContext.inherit();        
        const trans = new ResolveIdentifiersTransform(schemaCtx);
        trans.visitSchema(schemaCtx.schema, globalContext);
    }
}
