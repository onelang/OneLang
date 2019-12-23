import { ISchemaTransform } from "./../SchemaTransformer";
import { OneAst as one } from "./../Ast";
import { SchemaContext } from "../SchemaContext";
import { AstVisitor } from "../AstVisitor";
import { AstHelper } from "../AstHelper";

/**
 * Converts expression `"literal1" + variable + "lit2" + ...`
 *   to template string `"literal1${variable}lit2..."`.
 */
export class ForceTemplateStrings extends AstVisitor<void> {
    protected infixCollect(expr: one.BinaryExpression, result: one.Expression[]) {
        if (expr.operator === "+") {
            for (const child of [expr.left, expr.right]) {
                if (child.exprKind === "Binary") {
                    this.infixCollect(<one.BinaryExpression> child, result);
                } else {
                    result.push(child);
                }
            }
        } else {
            result.push(expr);
        }
    }

    protected visitBinaryExpression(expr: one.BinaryExpression) {
        if (expr.operator === "+" && expr.left.valueType.isString) {
            const exprList: one.Expression[] = [];
            this.infixCollect(expr, exprList);

            const parts = exprList.map(x => {
                if (x.exprKind === "Literal" && (<one.Literal>x).literalType === "string")
                    return <one.TemplateStringPart> { literal: true, text: (<one.Literal>x).value };
                else
                    return <one.TemplateStringPart> { literal: false, expr: x };
            });
            const tmplStr = <one.TemplateString> { exprKind: "TemplateString", parts };

            AstHelper.replaceProperties(expr, tmplStr);
        } else {
            super.visitBinaryExpression(expr, null);
        }
    }

    transform(schemaCtx: SchemaContext) {
        this.visitSchema(schemaCtx.schema, null);
    }
}