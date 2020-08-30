import { IExpression } from "../One/Ast/Interfaces";
import { Statement } from "../One/Ast/Statements";

export interface IGeneratorPlugin {
    expr(expr: IExpression): string;
    stmt(stmt: Statement): string;
}