import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression } from "../../Ast/Expressions";
import { Lambda } from "../../Ast/Types";
import { LambdaType, Type } from "../../Ast/AstTypes";
import { ReturnStatement, Statement } from "../../Ast/Statements";

export class LambdaResolver extends InferTypesPlugin {
    name = "LambdaResolver";

    protected setupLambdaParameterTypes(lambda: Lambda) {
        if (lambda.expectedType === null) return;
        
        if (lambda.expectedType instanceof LambdaType) {
            const declParams = lambda.expectedType.parameters;
            if (declParams.length !== lambda.parameters.length)
                this.errorMan.throw(`Expected ${lambda.parameters.length} parameters for lambda, but got ${declParams.length}!`);
            else {
                for (let i = 0; i < declParams.length; i++) {
                    if (lambda.parameters[i].type === null)
                        lambda.parameters[i].type = declParams[i].type;
                    else if (!Type.isAssignableTo(lambda.parameters[i].type, declParams[i].type))
                        this.errorMan.throw(`Parameter type ${lambda.parameters[i].type.repr()} cannot be assigned to ${declParams[i].type.repr()}.`);
                }
            }
        } else
            this.errorMan.throw("Expected LambdaType as Lambda's type!");
    }

    protected processReturnExpr(returnExpr: Expression) {
    }

    protected visitLambda(lambda: Lambda): void {
        this.setupLambdaParameterTypes(lambda);
        this.main.visitLambda(lambda);
    }

    canTransform(expr: Expression) { return expr instanceof Lambda; }

    transform(expr: Expression): Expression {
        this.visitLambda(<Lambda> expr);
        // does not transform actually
        return expr;
    }
}
