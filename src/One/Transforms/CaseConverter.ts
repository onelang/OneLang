import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

export class CaseConverter extends AstVisitor<void> {
    constructor(public casing: LangFileSchema.CasingOptions) { super(); }

    toSnakeCase(name: string) { 
        let result = "";
        for (let c of name) {
            if ("A" <= c && c <= "Z")
                result += (result === "" ? "" : "_") + c.toLowerCase();
            else if("a" <= c && c <= "z" || c === "_" || "0" <= c && c <= "9")
                result += c;
            else
                this.log(`Invalid character ('${c}') in name: ${name}.`);
        }
        return result;
    }

    getName(name: string, type: "class"|"method"|"field"|"property"|"variable"|"enum") {
        const snakeCase = this.toSnakeCase(name);
        const casing = this.casing[type];
        if (!casing) return snakeCase; // TODO

        const parts = snakeCase.split("_").map(x => x.toLowerCase());
        if (casing === LangFileSchema.Casing.CamelCase)
            return parts[0] + parts.splice(1).map(x => x.ucFirst()).join("");
        else if (casing === LangFileSchema.Casing.PascalCase)
            return parts.map(x => x.ucFirst()).join("");
        else if (casing === LangFileSchema.Casing.SnakeCase)
            return parts.join("_");
        else
            this.log(`Unknown casing: ${casing}`);
    }

    protected visitMethod(method: one.Method) {
        method.name = this.getName(method.name, "method");
        super.visitMethod(method, null);
    }
 
    protected visitField(field: one.Field) {
        field.name = this.getName(field.name, "field");
        super.visitField(field, null);
    }
 
    protected visitProperty(prop: one.Property) {
        prop.name = this.getName(prop.name, "property");
        super.visitProperty(prop, null);
    }

    protected visitClass(cls: one.Class) {
        cls.name = this.getName(cls.name, "class");
        super.visitClass(cls, null);
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration) {
        stmt.name = this.getName(stmt.name, "variable");
        super.visitVariableDeclaration(stmt, null);
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, null);
    }
}
