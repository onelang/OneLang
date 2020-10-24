import { SourceFile, IMethodBase, IHasAttributesAndTrivia, Package, IMethodBaseWithTrivia } from "../Ast/Types";
import { ForeachStatement, ForStatement, IfStatement, Block, WhileStatement, DoStatement } from "../Ast/Statements";

/**
 * Extract `@attributeName attribute value` attributes from comments (// and /* style comments)
 */
export class FillAttributesFromTrivia {
    static processTrivia(trivia: string) {
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

    private static process(items: IHasAttributesAndTrivia[]) {
        for (const item of items)
            item.attributes = this.processTrivia(item.leadingTrivia);
    }

    private static processBlock(block: Block): void {
        if (block === null) return;
        this.process(block.statements);
        for (const stmt of block.statements) {
            if (stmt instanceof ForeachStatement)
                this.processBlock(stmt.body);
            else if (stmt instanceof ForStatement)
                this.processBlock(stmt.body);
            else if (stmt instanceof WhileStatement)
                this.processBlock(stmt.body);
            else if (stmt instanceof DoStatement)
                this.processBlock(stmt.body);
            else if (stmt instanceof IfStatement) {
                this.processBlock(stmt.then);
                this.processBlock(stmt.else_);
            }
        }
    }

    private static processMethod(method: IMethodBaseWithTrivia) {
        if (method === null) return;
        this.process([method]);
        this.process(method.parameters);
        this.processBlock(method.body);
    }

    static processFile(file: SourceFile): void {
        this.process(file.imports);
        this.process(file.enums);
        this.process(file.interfaces);
        this.process(file.classes);
        this.processBlock(file.mainBlock);

        for (const intf of file.interfaces)
            for (const method of intf.methods)
                this.processMethod(method);

        for (const cls of file.classes) {
            this.processMethod(cls.constructor_);
            this.process(cls.fields);
            this.process(cls.properties);
            for (const prop of cls.properties) {
                this.processBlock(prop.getter);
                this.processBlock(prop.setter);
            }
            for (const method of cls.methods)
                this.processMethod(method);
        }
    }

    static processPackage(pkg: Package): void {
        for (const file of Object.values(pkg.files))
            this.processFile(file);
    }
}