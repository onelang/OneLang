import * as Ast from "./ExprLangAst";

export class ExprLangAstPrinter {
    static removeOuterParen(repr: string) {
        return repr.startsWith("(") && repr.endsWith(")") ? repr.substr(1, repr.length - 2) : repr;
    }
    
    static print(expr: Ast.Expression): string {
        if (expr.kind === "literal") {
            const litExpr = <Ast.LiteralExpression>expr;
            return litExpr.type === "string" ? `"${(<String>litExpr.value).replace(/"/g, '\\"')}"` : `${litExpr.value}`;
        } else if (expr.kind === "identifier") {
            return (<Ast.IdentifierExpression>expr).text;
        } else if (expr.kind === "unary") {
            const unaryExpr = <Ast.UnaryExpression> expr;
            const exprRepr = this.print(unaryExpr.expr);
            return `(${unaryExpr.op}${exprRepr})`;
        } else if (expr.kind === "binary") {
            const binaryExpr = <Ast.BinaryExpression> expr;
            const leftRepr = this.print(binaryExpr.left);
            const rightRepr = this.print(binaryExpr.right);
            return `(${leftRepr} ${binaryExpr.op} ${rightRepr})`;
        } else if (expr.kind === "parenthesized") {
            const parenExpr = <Ast.ParenthesizedExpression> expr;
            const exprRepr = this.print(parenExpr.expr);
            return `(${this.removeOuterParen(exprRepr)})`;
        } else if (expr.kind === "conditional") {
            const condExpr = <Ast.ConditionalExpression> expr;
            const condRepr = this.print(condExpr.condition);
            const thenRepr = this.print(condExpr.whenTrue);
            const elseRepr = this.print(condExpr.whenFalse);
            return `(${condRepr} ? ${thenRepr} : ${elseRepr})`;
        } else if (expr.kind === "call") {
            const callExpr = <Ast.CallExpression> expr;
            const methodRepr = this.print(callExpr.method);
            const argReprs = callExpr.arguments.map(arg => this.print(arg));
            return `(${methodRepr}(${argReprs.join(", ")}))`;
        } else if (expr.kind === "propertyAccess") {
            const propAccExpr = <Ast.PropertyAccessExpression> expr;
            const objectRepr = this.print(propAccExpr.object);
            return `(${objectRepr}.${propAccExpr.propertyName})`;
        } else if (expr.kind === "elementAccess") {
            const elemAccExpr = <Ast.ElementAccessExpression> expr;
            const objectRepr = this.print(elemAccExpr.object);
            const elementRepr = this.print(elemAccExpr.elementExpr);
            return `(${objectRepr}[${elementRepr}])`;
        } else {
            throw new Error(`[AstPrinter] Unknown expression kind: '${expr.kind}'`);
        }
    }
}
