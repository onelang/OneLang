import { RegexHelpers } from "../../Utils/RegexHelpers";
import { SourceFile, IMethodBase, Block, IHasAttributesAndTrivia, Package } from "../Ast/Types";
import { ForeachStatement, ForStatement, IfStatement } from "../Ast/Statements";

export class FillAttributesFromTrivia {
    static processTrivia(trivia: string) {
        const result = {};
        if (trivia !== "") {
            const matches = RegexHelpers.matches(/(?:\n|^)\s*(?:\/\/|#)\s*@([a-z0-9_.-]+)(?: ([^\n]+)|$|\n)/g, trivia);
            for (const match of matches)
                result[match[1]] = match[2] || true;
        }
        return result;
    }

    private static process(items: IHasAttributesAndTrivia[]) {
        for (const item of items)
            item.attributes = this.processTrivia(item.leadingTrivia);
    }

    private static processMap(items: IterableIterator<IHasAttributesAndTrivia>) {
        this.process(Array.from(items));
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
                this.processBlock(stmt.else_);
            }
        }
    }

    static processFile(file: SourceFile) {
        this.process(file.imports);
        this.processMap(file.enums.values());
        this.processMap(file.interfaces.values());
        this.processMap(file.classes.values());
        this.processBlock(file.mainBlock);

        for (const intf of file.interfaces.values())
            for (const method of intf.methods.values())
                this.processMethod(method);

        for (const cls of file.classes.values()) {
            this.processMethod(cls.constructor_);
            this.processMap(cls.fields.values());
            this.processMap(cls.properties.values());
            for (const prop of cls.properties.values()) {
                this.processBlock(prop.getter);
                this.processBlock(prop.setter);
            }
            for (const method of cls.methods.values())
                this.processMethod(method);
        }
    }

    static processPackage(pkg: Package) {
        for (const file of Object.values(pkg.files))
            this.processFile(file);
    }
}