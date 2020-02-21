import { AstVisitor } from "./AstVisitor";
import { Class, Method, SourceFile } from "./Ast/Types";

export class AstTransformer<T> extends AstVisitor<T> {
    schema: SourceFile;
    currentClass: Class;
    currentMethod: Method;

    protected visitMethod(method: Method, context: T) {
        this.currentMethod = method;
        super.visitMethod(method, context);
        this.currentMethod = null;
    }

    protected visitClass(cls: Class, context: T) {
        this.currentClass = cls;
        super.visitClass(cls, context);
        this.currentClass = null;
    }

    protected visitSchema(schema: SourceFile, context: T) {
        this.schema = schema;
        super.visitSourceFile(schema, context);
        this.schema = null;
    }

    process(schema: SourceFile) {
        this.visitSourceFile(schema, null);
    }
}