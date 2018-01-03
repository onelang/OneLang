import { OneAst as one } from "./Ast";
import { AstVisitor } from "./AstVisitor";

export class AstTransformer<T> extends AstVisitor<T> {
    schema: one.Schema;
    currentClass: one.Class;
    currentMethod: one.Method;

    protected visitMethod(method: one.Method, context: T) {
        this.currentMethod = method;
        super.visitMethod(method, context);
        this.currentMethod = null;
    }

    protected visitClass(cls: one.Class, context: T) {
        this.currentClass = cls;
        super.visitClass(cls, context);
        this.currentClass = null;
    }

    protected visitSchema(schema: one.Schema, context: T) {
        this.schema = schema;
        super.visitSchema(schema, context);
        this.schema = null;
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, null);
    }
}