import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

export class IncludesCollector extends AstVisitor<void> {
    includes: Set<string>;

    constructor(public lang: LangFileSchema.LangFile) { 
        super();
        this.includes = new Set<string>(lang.includes || []);
    }

    useInclude(className: string, methodName?: string) {
        const cls = this.lang.classes[className];
        if (!cls) return;
        const includes = (cls.includes || []).concat(methodName ? cls.methods[methodName].includes || [] : []);
        for (const include of includes)
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
