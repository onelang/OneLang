import { ErrorManager } from "../../../ErrorManager";
import { Expression } from "../../../Ast/Expressions";
import { InferTypes } from "../../InferTypes";
import { Statement } from "../../../Ast/Statements";
import { Property, Lambda, Method, IMethodBase } from "../../../Ast/Types";

export class InferTypesPlugin {
    main: InferTypes;
    errorMan: ErrorManager = null;

    constructor(public name: string) { }

    canTransform(expr: Expression): boolean { return false; }
    canDetectType(expr: Expression): boolean { return false; }

    transform(expr: Expression): Expression { return expr; }
    detectType(expr: Expression): boolean { return false; }

    handleProperty(prop: Property): boolean { return false; }
    handleLambda(lambda: Lambda): boolean { return false; }
    handleMethod(method: IMethodBase): boolean { return false; }
    handleStatement(stmt: Statement): boolean { return false; }
}
