import { AstTransformer } from "../AstTransformer";
import { UnresolvedType, GenericsType } from "../Ast/AstTypes";
import { Class, IVariable, Lambda, Method } from "../Ast/Types";
import { IType } from "../Ast/Interfaces";
import { InstanceFieldReference, InstancePropertyReference, StaticFieldReference, StaticPropertyReference, VariableReference } from "../Ast/References";

/**
 * Fills out Lambda(Expression)'s `captures` property with the variables which
 *   'captured' by the lambda, which are 'come' outside of the lambda's body.
 * 
 * These are the variables which are not lambda input method parameters and 
 *   not variables declared within the lambda.
 */
export class LambdaCaptureCollector extends AstTransformer {
    scopeVarStack: Set<IVariable>[] = [];
    scopeVars: Set<IVariable> = null;
    capturedVars: Set<IVariable> = null;

    constructor() { super("LambdaCaptureCollector"); }

    protected visitLambda(lambda: Lambda): Lambda {
        if (this.scopeVars !== null)
            this.scopeVarStack.push(this.scopeVars);

        this.scopeVars = new Set<IVariable>();
        this.capturedVars = new Set<IVariable>();

        super.visitLambda(lambda);
        lambda.captures = [];
        for (const capture of this.capturedVars.values())
            lambda.captures.push(capture);
        
        this.scopeVars = this.scopeVarStack.length > 0 ? this.scopeVarStack.pop() : null;
        return null;
    }

    protected visitVariable(variable: IVariable): IVariable {
        if (this.scopeVars === null) return null;
        this.scopeVars.add(variable);
        return null;
    }

    protected visitVariableReference(varRef: VariableReference): VariableReference {
        if (varRef instanceof StaticFieldReference ||
            varRef instanceof InstanceFieldReference ||
            varRef instanceof StaticPropertyReference ||
            varRef instanceof InstancePropertyReference) return null;
        if (this.scopeVars === null) return null;
        const vari = varRef.getVariable();
        if (!this.scopeVars.has(vari))
            this.capturedVars.add(vari);
        return null;
    }
}