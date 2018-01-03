import { OneAst as one } from "../Ast";
import { AstTransformer } from "../AstTransformer";

export class RemoveEmptyTemplateStringLiterals extends AstTransformer<void> {
    protected visitTemplateString(expr: one.TemplateString) {
        super.visitTemplateString(expr, null);
        expr.parts = expr.parts.filter(x => !x.literal || x.text !== "");
    }
}