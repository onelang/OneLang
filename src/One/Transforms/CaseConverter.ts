import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

export class CaseConverter {
    static splitName(name: string, error?: (msg: string) => void) {
        let parts: string[] = [];
        let currPart = "";

        for (let c of name) {
            if (("A" <= c && c <= "Z") || c === "_") {
                if (currPart !== "") {
                    parts.push(currPart);
                    currPart = "";
                }

                if (c !== "_")
                    currPart += c.toLowerCase();
            } else if("a" <= c && c <= "z" || "0" <= c && c <= "9") {
                currPart += c;
            } else {
                error && error(`Invalid character ('${c}') in name: ${name}.`);
            }
        }

        if (currPart !== "")
            parts.push(currPart);

        let prefixLen = 0, postfixLen = 0;
        for (; prefixLen < name.length && name[prefixLen] === '_'; prefixLen++) { }
        for (; postfixLen < name.length && name[name.length - postfixLen - 1] === '_'; postfixLen++) { }

        if (prefixLen > 0)
            parts[0] = "_".repeat(prefixLen) + parts[0];

        if (postfixLen > 0)
            parts[parts.length - 1] = parts[parts.length - 1] + "_".repeat(postfixLen);

        return parts;
    }

    static convert(name: string, newCasing: "snake"|"pascal"|"camel"|"upper", error?: (msg: string) => void) {
        const parts = CaseConverter.splitName(name);

        if (newCasing === "camel")
            return parts[0] + parts.splice(1).map(x => x.ucFirst()).join("");
        else if (newCasing === "pascal")
            return parts.map(x => x.ucFirst()).join("");
        else if (newCasing === "upper")
            return parts.map(x => x.toUpperCase()).join("_");
        else if (newCasing === "snake")
            return parts.join("_");
        else
            error(`Unknown casing: ${newCasing}`);
    }
}

export class SchemaCaseConverter extends AstVisitor<void> {
    constructor(public casing: LangFileSchema.CasingOptions) { super(); }

    getName(name: string, type: "class"|"method"|"field"|"property"|"variable"|"enum"|"enumMember") {
        // TODO: throw exception instead of using default snake_case?
        return CaseConverter.convert(name, 
            this.casing[type] === LangFileSchema.Casing.PascalCase ? "pascal" :
            this.casing[type] === LangFileSchema.Casing.CamelCase ? "camel" :
            this.casing[type] === LangFileSchema.Casing.UpperCase ? "upper" : 
            "snake", this.log);
    }

    protected visitMethod(method: one.Method) {
        super.visitMethod(method, null);
        method.outName = this.getName(method.name, "method");
    }
 
    protected visitField(field: one.Field) {
        super.visitField(field, null);
        field.outName = this.getName(field.name, "field");
    }
 
    protected visitProperty(prop: one.Property) {
        super.visitProperty(prop, null);
        prop.outName = this.getName(prop.name, "property");
    }

    protected visitClass(cls: one.Class) {
        super.visitClass(cls, null);
        cls.outName = this.getName(cls.name, "class");
    }

    protected visitEnum(enum_: one.Enum) {
        super.visitEnum(enum_, null);
        enum_.outName = this.getName(enum_.name, "enum");
    }

    protected visitEnumMember(enumMember: one.EnumMember) {
        super.visitEnumMember(enumMember, null);
        enumMember.outName = this.getName(enumMember.name, "enumMember");
    }

    protected visitVariableDeclaration(stmt: one.VariableDeclaration) {
        super.visitVariableDeclaration(stmt, null);
        stmt.name = this.getName(stmt.name, "variable");
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, null);
    }
}
