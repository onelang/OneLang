import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";
import { lcFirst } from "../../Utils/StringHelpers";

export class IncludesCollector extends AstVisitor<void> {
    includes: Set<string>;

    constructor(public lang: LangFileSchema.LangFile) { 
        super();
        this.includes = new Set<string>(lang.includes);
    }

    useInclude(className: string, methodName?: string) {
        const cls = this.lang.classes[className];
        if (!cls) return;
        const includes = cls.includes.concat(cls.methods && methodName ? (cls.methods[methodName] || { includes: [] }).includes : []);
        for (const include of includes)
            this.includes.add(include);
    }

    protected visitExpression(expression: one.Expression) {
        super.visitExpression(expression, null);
        const templateObj = this.lang.expressions[lcFirst(expression.exprKind)];
        if (typeof templateObj === "object" && templateObj.includes)
            for (const include of templateObj.includes)
                this.includes.add(include);
    }

    protected visitBinaryExpression(expr: one.BinaryExpression) {
        super.visitBinaryExpression(expr, null);

        // TODO: code duplicated from code generator -> unify these logics into one
        const leftType = expr.left.valueType.repr();
        const rightType = expr.right.valueType.repr();
        const opName = `${leftType} ${expr.operator} ${rightType}`;
        const op = this.lang.operators && this.lang.operators[opName];
        if (!op) return;

        for (const include of op.includes)
            this.includes.add(include);
    }
    
    protected visitMethodReference(methodRef: one.MethodReference) {
        super.visitMethodReference(methodRef, null);
        this.useInclude(methodRef.valueType.classType.className, methodRef.valueType.methodName);
    }

    protected visitClassReference(classRef: one.ClassReference) {
        super.visitClassReference(classRef, null);
        this.useInclude(classRef.valueType.className);
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, null);
    }
}
