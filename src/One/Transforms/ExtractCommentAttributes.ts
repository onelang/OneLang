import { OneAst as one } from "../Ast";
import { AstTransformer } from "../AstTransformer";

export class ExtractCommentAttributes extends AstTransformer<void> {
    processTrivia(trivia: string) {
        const result = {};
        if (trivia !== "") {
            const matches = /(?:\n|^)\s*(?:\/\/|#)\s*@([a-z0-9_-]+)(?: ([^\n]+)|$|\n)/g.matches(trivia);
            for (const match of matches)
                result[match[1]] = match[2] || true;
        }
        return result;
    }

    protected visitMethodLike(method: one.Method|one.Constructor) {
        method.attributes = this.processTrivia(method.leadingTrivia);
        super.visitMethodLike(method, null);
    }

    protected visitClass(cls: one.Class) {
        cls.attributes = this.processTrivia(cls.leadingTrivia);
        super.visitClass(cls, null);
    }
    
    protected visitInterface(intf: one.Interface) {
        intf.attributes = this.processTrivia(intf.leadingTrivia);
        super.visitInterface(intf, null);
    }
}