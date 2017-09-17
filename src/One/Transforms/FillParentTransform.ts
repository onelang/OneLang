import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { OneAst as one } from "../Ast";
import { SchemaContext } from "../SchemaContext";

export class FillParentTransform extends AstVisitor<any> implements ISchemaTransform {
    name: string = "fillParent";

    protected visitExpression(expression: one.Expression, parent: any) {
        expression.parent = parent;
        super.visitExpression(expression, expression);
    }

    protected visitStatement(statement: one.Statement, parent: any) {
        statement.parent = parent;
        super.visitStatement(statement, statement);
    }

    protected visitBlock(block: one.Block, parent: any) {
        block.parent = parent;
        super.visitBlock(block, block);
    }

    protected visitMethod(method: one.Method, parent: any) { 
        method.parent = parent;
        super.visitMethod(method, method);
    }

    protected visitClass(cls: one.Class, parent: any) {
        cls.parent = parent;
        super.visitClass(cls, cls);
    }
    
    transform(schemaCtx: SchemaContext) {
        const schema = schemaCtx.schema;
        this.visitSchema(schema, schema);
    }
}