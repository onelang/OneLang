import { SourceFile, IMethodBase, IHasAttributesAndTrivia, Package, IMethodBaseWithTrivia } from "../Ast/Types";
import { ForeachStatement, ForStatement, IfStatement, Block, WhileStatement, DoStatement } from "../Ast/Statements";
import { AstTransformer } from "../AstTransformer";
import { Expression } from "../Ast/Expressions";

/**
 * Extract `@attributeName attribute value` attributes from comments (// and /* style comments)
 */
export class FillAttributesFromTrivia extends AstTransformer {
    constructor() { super("FillAttributesFromTrivia"); }

    protected visitAttributesAndTrivia(node: IHasAttributesAndTrivia) {
        node.attributes = FillAttributesFromTrivia.processTrivia(node.leadingTrivia);
    }

    // optimization
    protected visitExpression(expr: Expression): Expression { return null; }

    static processTrivia(trivia: string): { [name: string]: string } {
        const result: { [name: string]: string } = {};
        if (trivia !== null && trivia !== "") {
            const regex = /(?:\n|^)\s*(?:\/\/|#|\/\*\*?)\s*@([a-z0-9_.-]+) ?((?!\n|\*\/|$).+)?/g;
            while(true) {
                const match = regex.exec(trivia) || null;
                if (match === null) break;
                if (match[1] in result)
                    // @php $result[$match[1]] .= "\n" . $match[2];
                    // @python result[match[1]] += "\n" + match[2]
                    // @csharp result[match[1]] += "\n" + match[2];
                    // @java result.put(match[1], result.get(match[1]) + "\n" + match[2]);
                    result[match[1]] += "\n" + match[2];
                else
                    result[match[1]] = match[2] || "true";
            }
        }
        return result;
    }
}