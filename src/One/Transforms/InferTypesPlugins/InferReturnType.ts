import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Property, Lambda, Method, IMethodBase } from "../../Ast/Types";
import { VoidType, AnyType, LambdaType, ClassType, TypeHelper } from "../../Ast/AstTypes";
import { Statement, ReturnStatement, ThrowStatement } from "../../Ast/Statements";
import { ErrorManager } from "../../ErrorManager";
import { NullLiteral, Expression } from "../../Ast/Expressions";
import { IType } from "../../Ast/Interfaces";

class ReturnTypeInferer {
    returnsNull = false;
    throws = false;
    returnTypes: IType[] = [];

    constructor(public errorMan: ErrorManager) { }

    addReturn(returnValue: Expression) {
        if (returnValue instanceof NullLiteral) {
            this.returnsNull = true;
            return;
        }

        const returnType = returnValue.actualType;
        if (returnType === null)
            throw new Error("Return type cannot be null");

        if (!this.returnTypes.some(x => TypeHelper.equals(x, returnType)))
            this.returnTypes.push(returnType);
    }

    finish(declaredType: IType, errorContext: string, asyncType: ClassType): IType {
        let inferredType: IType = null;

        if (this.returnTypes.length == 0) {
            if (this.throws)
                inferredType = declaredType || VoidType.instance;
            else if (this.returnsNull) {
                if (declaredType !== null)
                    inferredType = declaredType;
                else
                    this.errorMan.throw(`${errorContext} returns only null and it has no declared return type!`);
            } else
                inferredType = VoidType.instance;
        } else if (this.returnTypes.length == 1) {
            inferredType = this.returnTypes[0];
        } else {
            if (declaredType !== null && this.returnTypes.every((x, i) => TypeHelper.isAssignableTo(x, declaredType)))
                inferredType = declaredType;
            else {
                this.errorMan.throw(`${errorContext} returns different types: ${this.returnTypes.map(x => x.repr()).join(", ")}`);
                inferredType = AnyType.instance;
            }
        }

        let checkType = declaredType;
        if (checkType !== null && asyncType !== null && checkType instanceof ClassType && checkType.decl === asyncType.decl)
            checkType = checkType.typeArguments[0];

        if (checkType !== null && !TypeHelper.isAssignableTo(inferredType, checkType))
            this.errorMan.throw(`${errorContext} returns different type (${inferredType.repr()}) than expected ${checkType.repr()}`);

        this.returnTypes = null;
        return declaredType !== null ? declaredType : inferredType;
    }
}

export class InferReturnType extends InferTypesPlugin {
    returnTypeInfer: ReturnTypeInferer[] = [];

    get current() { return this.returnTypeInfer[this.returnTypeInfer.length - 1]; }

    constructor() { super("InferReturnType"); }

    start() {
        this.returnTypeInfer.push(new ReturnTypeInferer(this.errorMan));
    }

    finish(declaredType: IType, errorContext: string, asyncType: ClassType): IType {
        return this.returnTypeInfer.pop().finish(declaredType, errorContext, asyncType);
    }

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
        lambda.returns = this.finish(lambda.returns, "Lambda", null);
        lambda.setActualType(new LambdaType(lambda.parameters, lambda.returns), false, true);
        return true;
    }

    handleMethod(method: IMethodBase): boolean {
        if (method instanceof Method && method.body !== null) {
            this.start();
            this.main.processMethodBase(method);
            method.returns = this.finish(method.returns, `Method "${method.name}"`, method.async ? this.main.currentFile.literalTypes.promise : null);
            return true;
        } else
            return false;
    }

    handleProperty(prop: Property): boolean {
        this.main.processVariable(prop);

        if (prop.getter !== null) {
            this.start();
            this.main.processBlock(prop.getter);
            prop.type = this.finish(prop.type, `Property "${prop.name}" getter`, null);
        }

        if (prop.setter !== null) {
            this.start();
            this.main.processBlock(prop.setter);
            this.finish(VoidType.instance, `Property "${prop.name}" setter`, null);
        }

        return true;
    }
}