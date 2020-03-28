import { AstTransformer } from "../AstTransformer";
import { IVariable, MutabilityInfo } from "../Ast/Types";
import { Expression, BinaryExpression, InstanceMethodCallExpression } from "../Ast/Expressions";
import { VariableReference } from "../Ast/References";

export class FillMutabilityInfo extends AstTransformer {
    constructor() { super("FillMutabilityInfo"); }

    protected getVar(varRef: VariableReference) {
        const v = varRef.getVariable();
        v.mutability = v.mutability || new MutabilityInfo();
        return v;
    }

    protected visitVariableReference(varRef: VariableReference): VariableReference {
        this.getVar(varRef).mutability.unused = false;
        return null;
    }

    protected visitExpression(expr: Expression): Expression {
        super.visitExpression(expr);

        if (expr instanceof BinaryExpression && expr.left instanceof VariableReference && expr.operator === "=") {
            this.getVar(expr.left).mutability.reassigned = true;
        } else if (expr instanceof InstanceMethodCallExpression && expr.object instanceof VariableReference && "mutates" in expr.method.attributes) {
            this.getVar(expr.object).mutability.mutated = true;
        }
        return null;
    }

    protected visitVariable(variable: IVariable): IVariable {
        variable.mutability = variable.mutability || new MutabilityInfo();
        return null;
    }
}