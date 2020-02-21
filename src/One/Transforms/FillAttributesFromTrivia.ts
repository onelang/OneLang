import { AstTransformer } from "../AstTransformer";
import { regexMatches } from "../../Utils/RegexHelpers";
import { SourceFile, IMethodBase, Block, IHasAttributesAndTrivia } from "../Ast/Types";
import { ForeachStatement, ForStatement, IfStatement } from "../Ast/Statements";

export class FillAttributesFromTrivia extends AstTransformer<void> {
    static processTrivia(trivia: string) {
        const result = {};
        if (trivia !== "") {
            const matches = regexMatches(/(?:\n|^)\s*(?:\/\/|#)\s*@([a-z0-9_.-]+)(?: ([^\n]+)|$|\n)/g, trivia);
            for (const match of matches)
                result[match[1]] = match[2] || true;
        }
        return result;
    }

    private static process(items: IHasAttributesAndTrivia[]) {
        for (const item of items)
            item.attributes = this.processTrivia(item.leadingTrivia);
    }

    private static processMethod(method: IMethodBase) {
        if (method === null) return;
        this.process([method]);
        this.processBlock(method.body);
    }

    private static processBlock(block: Block) {
        if (block === null) return;
        this.process(block.statements);
        for (const stmt of block.statements) {
            if (stmt instanceof ForeachStatement)
                this.processBlock(stmt.body);
            else if (stmt instanceof ForStatement)
                this.processBlock(stmt.body);
            else if (stmt instanceof IfStatement) {
                this.processBlock(stmt.then);
                this.processBlock(stmt.else);
            }
        }
    }

    static processFile(file: SourceFile) {
        this.process(file.imports);
        this.process(Object.values(file.enums));
        this.process(Object.values(file.interfaces));
        this.process(Object.values(file.classes));
        this.processBlock(file.mainBlock);

        for (const intf of Object.values(file.interfaces))
            for (const method of Object.values(intf.methods))
                this.processMethod(method);

        for (const cls of Object.values(file.classes)) {
            this.processMethod(cls.constructor_);
            this.process(Object.values(cls.fields));
            this.process(Object.values(cls.properties));
            for (const prop of Object.values(cls.properties)) {
                this.processBlock(prop.getter);
                this.processBlock(prop.setter);
            }
            for (const method of Object.values(cls.methods))
                this.processMethod(method);
        }
    }
}