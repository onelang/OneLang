import { AstTransformer } from "../AstTransformer";
import { Constructor, SourceFile } from "../Ast/Types";
import { UnresolvedCallExpression } from "../Ast/Expressions";
import { SuperReference } from "../Ast/References";
import { ExpressionStatement } from "../Ast/Statements";

export class ExtractSuperCall extends AstTransformer {
    name = "ExtractSuperCall";

    public visitSourceFile(sourceFile: SourceFile): void {
        this.errorMan.resetContext(this);
        this.currentFile = sourceFile;
        for (const c of sourceFile.classes.map(x => x.constructor_).filter(x => x !== null && x.body.statements.length > 0)) {
            const stmt = c.body.statements[0];
            if (stmt instanceof ExpressionStatement && stmt.expression instanceof UnresolvedCallExpression && stmt.expression.func instanceof SuperReference) {
                c.superCallArgs = stmt.expression.args;
                c.body.statements.shift();
            }
        }
        this.currentFile = null;
    }

}