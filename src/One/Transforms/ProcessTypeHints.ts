import { OneAst as one } from "./../Ast";
import { SchemaContext } from "../SchemaContext";
import { AstVisitor } from "../AstVisitor";
import { AstHelper } from "../AstHelper";
import { Reader } from "../../Parsers/Common/Reader";

export class ProcessTypeHints extends AstVisitor<void> {
    protected parseType(reader: Reader) {
        const typeName = reader.expectIdentifier();

        let type: one.Type;
        if (typeName === "string") {
            type = one.Type.Class("OneString");
        } else if (typeName === "bool") {
            type = one.Type.Class("OneBoolean");
        } else if (typeName === "number") {
            type = one.Type.Class("OneNumber");
        } else if (typeName === "char") {
            type = one.Type.Class("OneCharacter");
        } else if (typeName === "any") {
            type = one.Type.Any;
        } else if (typeName === "void") {
            type = one.Type.Void;
        } else {
            type = one.Type.Class(typeName);
            if (reader.readToken("<")) {
                do {
                    const generics = this.parseType(reader);
                    type.typeArguments.push(generics);
                } while(reader.readToken(","));
                reader.expectToken(">");
            }
        }

        while (reader.readToken("[]")) 
            type = one.Type.Class("OneArray", [type]);

        return type;
    }

    protected visitMethodLike(method: one.Method|one.Constructor) {
        super.visitMethodLike(method, null);

        if (method.attributes["signature"]) {
            try {
                const reader = new Reader(method.attributes["signature"]);
                const origMethodName = reader.expectIdentifier();
                reader.expectToken("(");

                for (const param of method.parameters) {
                    const origParamName = reader.expectIdentifier();
                    reader.expectToken(":");
                    param.type = this.parseType(reader);
                }

                reader.expectToken(")");
                if (reader.readToken(":")) {
                    (<one.Method> method).returns = this.parseType(reader);
                }
            } catch(e) {
                // TODO: report parsing error or something...
            }
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}