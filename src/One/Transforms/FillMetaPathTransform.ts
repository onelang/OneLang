import { ISchemaTransform } from "./../SchemaTransformer";
import { OneAst as one } from "./../Ast";
import { AstVisitor } from "../AstVisitor";
import { VariableContext } from "../VariableContext";
import { SchemaContext } from "../SchemaContext";

export class Context {
    names: { [name: string]: number } = {};

    constructor(public path: string[] = []) { }

    subContext(name: string, unique: boolean) {
        const lastIdx = this.names[name];
        if (unique && lastIdx)
            console.log(`[FillMetaPath::Context] Variable shadowing: ${this.path.join("/")}/${name}`);

        const newIdx = (lastIdx || 0) + 1;
        this.names[name] = newIdx;

        const newName = unique ? name : `${name}(${newIdx})`;
        
        return new Context([...this.path, newName]);
    }
}

export class FillMetaPathTransform extends AstVisitor<Context> implements ISchemaTransform {
    name = "fillMetaPath";
    dependencies = ["fillName"];

    protected subContext(oldContext: Context, item: one.NamedItem, name?: string) {
        const unique = !name;
        const newContext = oldContext.subContext(unique ? item.name : name, unique);
        
        if (!unique)
            item.name = newContext.path.last();
        item.metaPath = newContext.path.join("/");

        return newContext;
    }

    protected visitVariable(stmt: one.VariableBase, context: Context) {
        this.subContext(context, stmt);
    }

    protected visitIfStatement(stmt: one.IfStatement, context: Context) {
        const ifContext = this.subContext(context, stmt, "if");
        this.visitExpression(stmt.condition, ifContext);
        this.visitBlock(stmt.then, this.subContext(ifContext, stmt.then, "then"));
        this.visitBlock(stmt.else, this.subContext(ifContext, stmt.then, "else"));
    }

    protected visitWhileStatement(stmt: one.WhileStatement, context: Context) {
        super.visitWhileStatement(stmt, this.subContext(context, stmt, "while"));
    }

    protected visitForStatement(stmt: one.ForStatement, context: Context) {
        super.visitForStatement(stmt, this.subContext(context, stmt, "for"));
    }

    protected visitForeachStatement(stmt: one.ForeachStatement, context: Context) {
        super.visitForeachStatement(stmt, this.subContext(context, stmt, "foreach"));
    }

    protected visitMethod(method: one.Method, context: Context) {
        super.visitMethod(method, this.subContext(context, method));
    }

    protected visitClass(cls: one.Class, context: Context) {
        super.visitClass(cls, this.subContext(context, cls));
    }
    
    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, new Context());
    }
}