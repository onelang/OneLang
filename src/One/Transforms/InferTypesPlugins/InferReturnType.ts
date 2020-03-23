import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Property, Lambda, Method, IMethodBase } from "../../Ast/Types";
import { VoidType, Type, AnyType, LambdaType, AmbiguousType } from "../../Ast/AstTypes";
import { Statement, ReturnStatement } from "../../Ast/Statements";
import { ErrorManager } from "../../ErrorManager";
import { NullLiteral } from "../../Ast/Expressions";

class ReturnTypeInferer {
    errorMan = new ErrorManager();
    returnTypes: Type[] = [];

    addReturnType(returnType: Type) {
        if (returnType === null)
            throw new Error("Return type cannot be null");

        if (!this.returnTypes.some(x => Type.equals(x, returnType)))
            this.returnTypes.push(returnType);
    }

    finish(declaredType: Type, errorContext: string): Type {
        let returnType: Type = null;

        if (this.returnTypes.length == 0) {
            returnType = VoidType.instance;
        } else if (this.returnTypes.length == 1) {
            returnType = this.returnTypes[0];
        } else {
            if (declaredType !== null && this.returnTypes.every(x => Type.isAssignableTo(x, declaredType)))
                returnType = declaredType;
            else {
                this.errorMan.throw(`${errorContext} returns different types: ${this.returnTypes.map(x => x.repr()).join(", ")}`);
                returnType = AnyType.instance;
            }
        }

        if (declaredType !== null && !Type.isAssignableTo(returnType, declaredType))
            this.errorMan.throw(`${errorContext} returns different type (${returnType.repr()}) than expected ${declaredType.repr()}`);

        this.returnTypes = null;
        return returnType;
    }
}

export class InferReturnType extends InferTypesPlugin {
    returnTypeInfer: ReturnTypeInferer[] = [];

    handleStatement(stmt: Statement) {
        if (stmt instanceof ReturnStatement && stmt.expression !== null) {
            this.main.processStatement(stmt);
            if (this.returnTypeInfer.length !== 0) {
                const inferer = this.returnTypeInfer[this.returnTypeInfer.length - 1];
                if (!(stmt.expression instanceof NullLiteral))
                    inferer.addReturnType(stmt.expression.actualType);
            }
            return true;
        } else
            return false;
    }

    handleLambda(lambda: Lambda): boolean {
        this.returnTypeInfer.push(new ReturnTypeInferer());
        this.main.processLambda(lambda);
        lambda.returns = this.returnTypeInfer.pop().finish(lambda.returns, "Lambda");
        lambda.setActualType(new LambdaType(lambda.parameters, lambda.returns));
        return true;
    }

    handleMethod(method: IMethodBase): boolean {
        if (method instanceof Method && method.body !== null) {
            this.returnTypeInfer.push(new ReturnTypeInferer());
            this.main.processMethodBase(method);
            method.returns = this.returnTypeInfer.pop().finish(method.returns, `Method "${method.name}"`);
            return true;
        } else
            return false;
    }

    handleProperty(prop: Property): boolean {
        this.main.processVariable(prop);

        if (prop.getter) {
            this.returnTypeInfer.push(new ReturnTypeInferer());
            this.main.processBlock(prop.getter);
            prop.type = this.returnTypeInfer.pop().finish(prop.type, `Property "${prop.name}"`);
        }

        if (prop.setter) {
            this.returnTypeInfer.push(new ReturnTypeInferer());
            this.main.processBlock(prop.setter);
            this.returnTypeInfer.pop().finish(VoidType.instance, `Property "${prop.name}"`);
        }

        return true;
    }
}