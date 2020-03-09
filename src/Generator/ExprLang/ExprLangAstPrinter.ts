import { LiteralExpression, IExpression, LiteralType, IdentifierExpression, UnaryExpression, BinaryExpression, ParenthesizedExpression, ConditionalExpression, CallExpression, PropertyAccessExpression, ElementAccessExpression } from "./ExprLangAst";

export class ExprLangAstPrinter {
    static removeOuterParen(repr: string) {
        return repr.startsWith("(") && repr.endsWith(")") ? repr.substr(1, repr.length - 2) : repr;
    }
    
    static print(expr: IExpression): string {
        if (expr instanceof LiteralExpression) {
            return expr.type === LiteralType.String ? `"${(<string>expr.value).replace(/"/g, '\\"')}"` : `${expr.value}`;
        } else if (expr instanceof IdentifierExpression) {
            return expr.text;
        } else if (expr instanceof UnaryExpression) {
            const exprRepr = this.print(expr.expr);
            return `(${expr.op}${exprRepr})`;
        } else if (expr instanceof BinaryExpression) {
            const leftRepr = this.print(expr.left);
            const rightRepr = this.print(expr.right);
            return `(${leftRepr} ${expr.op} ${rightRepr})`;
        } else if (expr instanceof ParenthesizedExpression) {
            const exprRepr = this.print(expr.expr);
            return `(${this.removeOuterParen(exprRepr)})`;
        } else if (expr instanceof ConditionalExpression) {
            const condRepr = this.print(expr.condition);
            const thenRepr = this.print(expr.whenTrue);
            const elseRepr = this.print(expr.whenFalse);
            return `(${condRepr} ? ${thenRepr} : ${elseRepr})`;
        } else if (expr instanceof CallExpression) {
            const methodRepr = this.print(expr.method);
            const argReprs = expr.args.map(arg => this.print(arg));
            return `(${methodRepr}(${argReprs.join(", ")}))`;
        } else if (expr instanceof PropertyAccessExpression) {
            const objectRepr = this.print(expr.object);
            return `(${objectRepr}.${expr.propertyName})`;
        } else if (expr instanceof ElementAccessExpression) {
            const objectRepr = this.print(expr.object);
            const elementRepr = this.print(expr.elementExpr);
            return `(${objectRepr}[${elementRepr}])`;
        } else {
            throw new Error(`[AstPrinter] Unknown expression kind: '${expr}'`);
        }
    }
}
