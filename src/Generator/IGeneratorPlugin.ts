import { IExpression } from "../One/Ast/Expressions";
import { Statement } from "../One/Ast/Statements";

export interface IGeneratorPlugin {
    expr(expr: IExpression): string;
    stmt(stmt: Statement): string;
}