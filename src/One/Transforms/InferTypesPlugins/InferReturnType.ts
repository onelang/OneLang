import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Property, Lambda, Method, IMethodBase } from "../../Ast/Types";
import { VoidType, Type, AnyType, LambdaType } from "../../Ast/AstTypes";
import { Statement, ReturnStatement, ThrowStatement } from "../../Ast/Statements";
import { ErrorManager } from "../../ErrorManager";
import { NullLiteral, Expression } from "../../Ast/Expressions";

class ReturnTypeInferer {
    returnsNull = false;
    throws = false;
    returnTypes: Type[] = [];

    constructor(public errorMan: ErrorManager) { }

    addReturn(returnValue: Expression) {
        if (returnValue instanceof NullLiteral) {
            this.returnsNull = true;
            return;
        }

        const returnType = returnValue.actualType;
        if (returnType === null)
            throw new Error("Return type cannot be null");

        if (!this.returnTypes.some(x => Type.equals(x, returnType)))
            this.returnTypes.push(returnType);
    }

    finish(declaredType: Type, errorContext: string): Type {
        let returnType: Type = null;

        if (this.returnTypes.length == 0) {
            if (this.throws)
                returnType = declaredType || VoidType.instance;
            else if (this.returnsNull) {
                if (declaredType !== null)
                    returnType = declaredType;
                else
                    this.errorMan.throw(`${errorContext} returns only null and it has no declared return type!`);
            } else
                returnType = VoidType.instance;
        } else if (this.returnTypes.length == 1) {
            returnType = this.returnTypes[0];
        } else {
            if (declaredType !== null && this.returnTypes.every((x, i) => Type.isAssignableTo(x, declaredType)))
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

    start() {
        this.returnTypeInfer.push(new ReturnTypeInferer(this.errorMan));
    }

    finish(declaredType: Type, errorContext: string): Type {
        return this.returnTypeInfer.pop().finish(declaredType, errorContext);
    }

    get current() { return this.returnTypeInfer[this.returnTypeInfer.length - 1]; }

    handleStatement(stmt: Statement) {
        if (stmt instanceof ReturnStatement && stmt.expression !== null) {
            this.main.processStatement(stmt);
            if (this.returnTypeInfer.length !== 0)
                this.current.addReturn(stmt.expression);
            return true;
        } else if (stmt instanceof ThrowStatement) {
            if (this.returnTypeInfer.length !== 0)
                this.current.throws = true;
            return false;
        } else
            return false;
    }

    handleLambda(lambda: Lambda): boolean {
        this.start();
        this.main.processLambda(lambda);
        lambda.returns = this.finish(lambda.returns, "Lambda");
        lambda.setActualType(new LambdaType(lambda.parameters, lambda.returns), false, true);
        return true;
    }

    handleMethod(method: IMethodBase): boolean {
        if (method instanceof Method && method.body !== null) {
            this.start();
            this.main.processMethodBase(method);
            method.returns = this.finish(method.returns, `Method "${method.name}"`);
            return true;
        } else
            return false;
    }

    handleProperty(prop: Property): boolean {
        this.main.processVariable(prop);

        if (prop.getter) {
            this.start();
            this.main.processBlock(prop.getter);
            prop.type = this.finish(prop.type, `Property "${prop.name}" getter`);
        }

        if (prop.setter) {
            this.start();
            this.main.processBlock(prop.setter);
            this.finish(VoidType.instance, `Property "${prop.name}" setter`);
        }

        return true;
    }
}