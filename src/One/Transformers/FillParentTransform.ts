import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { OneAst } from "../Ast";

export class FillParentTransform extends AstVisitor<any> implements ISchemaTransform {
    name: string = "fillParent";

    protected visitExpression(expression: OneAst.Expression, parent: any) {
        expression.parent = parent;
        super.visitExpression(expression, expression);
    }

    protected visitStatement(statement: OneAst.Statement, parent: any) {
        statement.parent = parent;
        super.visitStatement(statement, statement);
    }

    protected visitBlock(block: OneAst.Block, parent: any) {
        block.parent = parent;
        super.visitBlock(block, block);
    }

    protected visitMethod(method: OneAst.Method, parent: any) { 
        method.parent = parent;
        super.visitMethod(method, method);
    }

    protected visitClass(cls: OneAst.Class, parent: any) {
        cls.parent = parent;
        super.visitClass(cls, cls);
    }
    
    transform(schema: OneAst.Schema) {
        this.visitSchema(schema, schema);
    }
}