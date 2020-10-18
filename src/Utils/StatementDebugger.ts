import { AstTransformer } from "../One/AstTransformer";
import { Statement } from "../One/Ast/Statements";
import { TSOverviewGenerator } from "./TSOverviewGenerator";
import { Expression } from "../One/Ast/Expressions";
import { Field } from "../One/Ast/Types";

export class StatementDebugger extends AstTransformer {
    constructor(public stmtFilterRegex: string) { super("StatementDebugger"); }

    visitExpression(expr: Expression): Expression {
        // optimization: no need to process these...
        return null;
    }

    protected visitField(field: Field): void {
        //if (field.name === "type" && field.parentInterface.name === "Interface") debugger;
        super.visitField(field);
    }

    visitStatement(stmt: Statement): Statement {
        const stmtRepr = TSOverviewGenerator.preview.stmt(stmt);
        // if (new RegExp(this.stmtFilterRegex).test(stmtRepr))
        //     debugger;
        return super.visitStatement(stmt);
    }
}
