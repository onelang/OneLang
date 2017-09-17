import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { SchemaContext } from "../SchemaContext";
import { ISchemaTransform } from "../SchemaTransformer";
import { VariableContext } from "../VariableContext";
import { ClassRepository } from "./InferTypesTransform";
import { AstHelper } from "../AstHelper";

export class Context {
    variables: VariableContext<one.Reference> = null;
    classes: ClassRepository = null;

    constructor(parent: Context = null) {
        this.variables = parent === null ? new VariableContext() : parent.variables.inherit();
        this.classes = parent === null ? new ClassRepository() : parent.classes;
    }

    addLocalVar(variable: one.VariableBase) {
        this.variables.add(variable.name, new one.LocalVariableRef(variable));
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
        if (variable) {
            AstHelper.replaceProperties(id, variable);
        } else {
            const cls = context.classes.getClass(id.text);
            if (cls) {
                AstHelper.replaceProperties(id, new one.ClassReference(cls));
            } else {
                this.log(`Could not find identifier: ${id.text}`);
            }
        }
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: Context) { 
        super.visitVariableDeclaration(stmt, context); 
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

    transform(schemaCtx: SchemaContext) {
        const globalContext = schemaCtx.tiContext.inherit();
        
        const classes = Object.values(schemaCtx.schema.classes);

        for (const cls of classes)
            globalContext.classes.addClass(cls);
        
        for (const cls of classes) {
            const classContext = globalContext.inherit();
            classContext.variables.add("this", one.ThisReference.instance);
            for (const method of Object.values(cls.methods)) {
                const methodContext = classContext.inherit();
                for (const param of method.parameters)
                    methodContext.variables.add(param.name, new one.LocalVariableRef(param, true));
                this.visitBlock(method.body, methodContext);
            }
        }
    }
}
