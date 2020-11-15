import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, NewExpression } from "../../Ast/Expressions";

// handles `new SomeObject(...)`
export class ResolveNewCalls extends InferTypesPlugin {
    constructor() { super("ResolveNewCalls"); }
    
    canTransform(expr: Expression) { return expr instanceof NewExpression; }

    transform(expr: Expression): Expression {
        const newExpr = <NewExpression> expr;
        for (let i = 0; i < newExpr.args.length; i++) {
            newExpr.args[i].setExpectedType(newExpr.cls.decl.constructor_.parameters[i].type);
            newExpr.args[i] = this.main.runPluginsOn(newExpr.args[i]);
        }
        expr.setActualType(newExpr.cls);
        return expr;
    }
}
