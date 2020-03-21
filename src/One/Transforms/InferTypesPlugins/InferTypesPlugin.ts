import { ErrorManager } from "../../ErrorManager";
import { Expression } from "../../Ast/Expressions";
import { InferTypes } from "../InferTypes";

export class InferTypesPlugin {
    main: InferTypes;
    errorMan: ErrorManager = null;

    visitExpression(expr: Expression): Expression { return null; }
}
