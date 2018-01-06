import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { SchemaContext } from "../SchemaContext";
import { ISchemaTransform } from "../SchemaTransformer";
import { VariableContext } from "../VariableContext";
import { ClassRepository } from "./InferTypesTransform";
import { AstHelper } from "../AstHelper";

export class Context {
    schemaCtx: SchemaContext = null;
    variables: VariableContext<one.Reference> = null;
    classes: ClassRepository = null;

    constructor(parent: Context = null) {
        this.schemaCtx = parent === null ? null : parent.schemaCtx;
        this.variables = parent === null ? new VariableContext() : parent.variables.inherit();
        this.classes = parent === null ? new ClassRepository() : parent.classes;
    }

    addLocalVar(variable: one.VariableBase) {
        this.variables.add(variable.name, one.VariableRef.MethodVariable(variable));
    }

    inherit() {
        return new Context(this);
    }
}

export class ResolveIdentifiersTransform extends AstVisitor<Context> implements ISchemaTransform {
    name: string = "resolveIdentifiers";
    dependencies = ["fillName"];

    protected visitIdentifier(id: one.Identifier, context: Context) {
        const variable = context.variables.get(id.text);
        const cls = context.classes.classes[id.text];
        const enum_ = context.schemaCtx.schema.enums[id.text];
        if (variable) {
            AstHelper.replaceProperties(id, variable, ["node"]);
        } else if (cls) {
            AstHelper.replaceProperties(id, new one.ClassReference(cls), ["node"]);
        } else if (enum_) {
            AstHelper.replaceProperties(id, new one.EnumReference(enum_), ["node"]);
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
        
    transform(schemaCtx: SchemaContext) {
        const globalContext = schemaCtx.tiContext.inherit();        
        globalContext.schemaCtx = schemaCtx;

        for (const cls of Object.values(schemaCtx.schema.classes))
            globalContext.classes.addClass(cls);

        this.visitSchema(schemaCtx.schema, globalContext);
    }
}
