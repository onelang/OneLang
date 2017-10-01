import { ISchemaTransform } from "./../SchemaTransformer";
import { OneAst as one } from "./../Ast";
import { SchemaContext } from "../SchemaContext";
import { AstVisitor } from "../AstVisitor";

export class TriviaCommentTransform extends AstVisitor<void> implements ISchemaTransform {
    name = "triviaComment";

    protected visitStatement(stmt: one.Statement) {
        const lines = stmt.leadingTrivia.split("\n");
        
        let newLines = [];
        let inComment = false;
        for (let line of lines) {
            const test = (r: RegExp) => {
                const match = r.test(line);
                if (match)
                    line = line.replace(r, "");
                return match;
            };

            if (test(/^\s*\/\//)) {
                newLines.push(`#${line}`);
            } else {
                inComment = inComment || test(/^\s*\/\*/);

                if (inComment) {
                    const closesComment = test(/\*\/\s*$/);

                    // do not convert "*/" to "#" (skip line)
                    if (!(closesComment && line === ""))
                        newLines.push("#" + line.replace(/^  /, ""));
                    
                    if (closesComment)
                        inComment = false;
                } else {
                    newLines.push(line);
                }
            }
        }

        stmt.leadingTrivia2 = newLines.join("\n");
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}