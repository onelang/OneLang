import { AstTransformer } from "../AstTransformer";
import { ErrorManager } from "../ErrorManager";
import { PropertyAccessExpression, Expression, CastExpression, ParenthesizedExpression, BinaryExpression, StringLiteral, UnresolvedCallExpression, StaticMethodCallExpression, InstanceMethodCallExpression, ConditionalExpression, InstanceOfExpression, RegexLiteral, TemplateString, NumericLiteral, NewExpression, ArrayLiteral, MapLiteral, NullLiteral, UnaryExpression, BooleanLiteral, ElementAccessExpression, NullCoalesceExpression, GlobalFunctionCallExpression, TodoExpression, LambdaCallExpression } from "../Ast/Expressions";
import { ClassReference, StaticFieldReference, StaticPropertyReference, StaticMethodReference, SuperReference, ThisReference, ForeachVariableReference, ForVariableReference, VariableDeclarationReference, InstanceFieldReference, InstancePropertyReference, InstanceMethodReference, MethodParameterReference, EnumReference, EnumMemberReference, Reference, GlobalFunctionReference, IGetMethodBase } from "../Ast/References";
import { SourceFile, Class, Method, IVariableWithInitializer, Workspace, Package, Property, Field, Constructor, IInterface, MethodParameter, Lambda, IMethodBase, Interface } from "../Ast/Types";
import { ClassType, InterfaceType, AnyType, Type, VoidType, GenericsType, EnumType, LambdaType, IInterfaceType } from "../Ast/AstTypes";
import { Statement, VariableDeclaration, ReturnStatement, ForeachStatement } from "../Ast/Statements";

export class InferTypes extends AstTransformer {
    name = "InferTypes";
    methodReturnTypesStack: Type[][] = [];
    lambdaLevel = 0;
    protected doNotVisitFieldsAndProps = false;

    constructor(public errorMan = new ErrorManager()) { super(); }

    protected getStaticRef(cls: Class, memberName: string): Reference {
        const field = cls.fields.find(x => x.name === memberName);
        if (field && field.isStatic)
            return new StaticFieldReference(field);

        const prop = cls.properties.find(x => x.name === memberName);
        if (prop && prop.isStatic)
            return new StaticPropertyReference(prop);

        const method = cls.methods.find(x => x.name === memberName);
        if (method && method.isStatic)
            return new StaticMethodReference(method);

        this.errorMan.throw(`Could not resolve static member access of a class: ${cls.name}::${memberName}`);
        return null;
    }

    protected getInstanceRef(cls: Class, memberName: string, obj: Expression): Reference {
        while (true) {
            const field = cls.fields.find(x => x.name === memberName) || null;
            if (field !== null && !field.isStatic)
                return new InstanceFieldReference(obj, field);
    
            const prop = cls.properties.find(x => x.name === memberName) || null;
            if (prop !== null && !prop.isStatic)
                return new InstancePropertyReference(obj, prop);
    
            const method = cls.methods.find(x => x.name === memberName) || null;
            if (method !== null && !method.isStatic)
                return new InstanceMethodReference(obj, method);

            if (cls.baseClass === null)
                break;

            cls = (<ClassType>cls.baseClass).decl;
        }

        this.errorMan.throw(`Could not resolve instance member access of a class: ${cls.name}::${memberName}`);
    }

    protected getInterfaceRef(intf: Interface, memberName: string, obj: Expression): Reference {
        const field = intf.fields.find(x => x.name === memberName) || null;
        if (field !== null && !field.isStatic)
            return new InstanceFieldReference(obj, field);

        const method = intf.methods.find(x => x.name === memberName) || null;
        if (method !== null && !method.isStatic)
            return new InstanceMethodReference(obj, method);

        for (const baseIntf of intf.baseInterfaces) {
            const res = this.getInterfaceRef((<InterfaceType>baseIntf).decl, memberName, obj);
            if (res !== null)
                return res;
        }

        return null;
    }

    protected inferPropertyAccess(expr: PropertyAccessExpression): Expression {
        if (expr.object instanceof EnumReference) {
            const member = expr.object.decl.values.find(x => x.name ===  expr.propertyName) || null;
            if (member === null) {
                this.errorMan.throw(`Enum member was not found: ${expr.object.decl.name}::${expr.propertyName}`);
                return null;
            }
            return new EnumMemberReference(member);
        }

        if (expr.object instanceof ClassReference)
            return this.getStaticRef(expr.object.decl, expr.propertyName);

        if (expr.object instanceof ThisReference && this.currentMethod instanceof Method && this.currentMethod.isStatic)
            return this.getStaticRef(expr.object.cls, expr.propertyName);

        if (expr.object instanceof SuperReference ||
            expr.object instanceof ThisReference) {
                return this.getInstanceRef(expr.object.cls, expr.propertyName, expr.object);
        }

        const type = expr.object.getType();
        if (type instanceof ClassType) {
            return this.getInstanceRef(type.decl, expr.propertyName, expr.object);
        } else if (type instanceof InterfaceType) {
            const ref = this.getInterfaceRef(type.decl, expr.propertyName, expr.object);
            if (ref === null)
                this.errorMan.throw(`Could not resolve instance member access of a interface: ${type.repr()}::${expr.propertyName}`);
            return ref;
        } else if (!type) {
            this.errorMan.throw(`Type was not inferred yet (prop="${expr.propertyName}")`);
        } else if (type instanceof AnyType) {
            this.errorMan.throw(`Object has any type (prop="${expr.propertyName}")`);
        } else {
            this.errorMan.throw(`Expected class as variable type, but got: ${type.constructor.name} (prop="${expr.propertyName}")`);
        }

        return null;
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer): IVariableWithInitializer {
        if (variable.type !== null && variable.initializer !== null)
            variable.initializer.setDeclaredType(variable.type);

        super.visitVariableWithInitializer(variable);

        if (variable.type === null && variable.initializer !== null)
            variable.type = variable.initializer.getType();

        return null;
    }

    protected visitLambda(lambda: Lambda): Lambda {
        this.lambdaLevel++;
        if (lambda.declaredType !== null) {
            if (lambda.declaredType instanceof LambdaType) {
                const declParams = lambda.declaredType.parameters;
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
        this.startReturnTypeInfering();
        super.visitLambda(lambda);
        lambda.returns = this.finishReturnTypeInfering(lambda.returns, "Lambda");
        lambda.setActualType(new LambdaType(lambda.parameters, lambda.returns));
        this.lambdaLevel--;
        return null;
    }

    protected visitStatement(stmt: Statement): Statement {
        if (stmt instanceof ReturnStatement && stmt.expression !== null) {
            if (this.lambdaLevel === 0 && this.currentMethod instanceof Method && this.currentMethod.returns !== null)
                stmt.expression.setDeclaredType(this.currentMethod.returns);

            super.visitStatement(stmt);

            const returnType = stmt.expression.getType();
            if (returnType === null) debugger;

            const retTypes = this.methodReturnTypesStack[this.methodReturnTypesStack.length - 1];
            if (!retTypes.some(x => Type.equals(x, returnType)))
                retTypes.push(returnType);
        } else if (stmt instanceof ForeachStatement) {
            stmt.items = this.visitExpression(stmt.items) || stmt.items;
            const arrayType = stmt.items.getType();
            if (arrayType instanceof ClassType && arrayType.decl === this.currentFile.literalTypes.array.decl) {
                stmt.itemVar.type = arrayType.typeArguments[0];
            } else
                this.errorMan.throw("Expected array as Foreach items variable");
            this.visitBlock(stmt.body);
        } else
            return super.visitStatement(stmt);
    }

    protected inferArrayOrMapItemType(items: Expression[], declaredType: Type, isMap: boolean) {
        const itemTypes: Type[] = [];
        for (const item of items)
            if (!itemTypes.some(t => Type.equals(t, item.getType())))
                itemTypes.push(item.getType());

        const literalType = isMap ? this.currentFile.literalTypes.map : this.currentFile.literalTypes.array;

        let itemType: Type = null;
        if (itemTypes.length === 0) {
            if (!declaredType) {
                this.errorMan.warn(`Could not determine the type of an empty ${isMap ? "MapLiteral" : "ArrayLiteral"}! Will use AnyType`);
                itemType = AnyType.instance;
            } else if (declaredType instanceof ClassType && declaredType.decl === literalType.decl) {
                itemType = declaredType.typeArguments[0];
            } else {
                itemType = AnyType.instance;
            }
        } else if (itemTypes.length === 1) {
            itemType = itemTypes[0];
        } else {
            this.errorMan.warn(`Could not determine the type of ${isMap ? "a MapLiteral" : "an ArrayLiteral"}! Multiple types were found: ${itemTypes.map(x => x.repr()).join(", ")}. Will use AnyType instead.`);
            itemType = AnyType.instance;
        }
        return itemType;
    }

    protected resolveClassGenericType(type: Type, clsType: IInterfaceType, method: Method, methodArgs: Type[] = null): Type {
        if (type instanceof GenericsType) {
            const classTypeArgs = clsType.decl.typeArguments;
            const clsTypeArgIdx = classTypeArgs.indexOf(type.typeVarName);
            if (clsTypeArgIdx !== -1) {
                if (classTypeArgs.length !== clsType.typeArguments.length)
                    throw new Error("Type arguments don't match!");
                return clsType.typeArguments[clsTypeArgIdx];
            } else {
                const methodTypeArgIdx = method.typeArguments.indexOf(type.typeVarName);
                if (methodTypeArgIdx !== -1) { // it's a method generic type, will be inferred later
                    return methodArgs ? methodArgs[methodTypeArgIdx] : type;
                } else {
                    throw new Error(`Generic type ${type.typeVarName} was not found in ${clsType.repr()}::${method.name}!`);
                }
            }
        } else if (type instanceof ClassType) {
            return new ClassType(type.decl, type.typeArguments.map(x => this.resolveClassGenericType(x, clsType, method, methodArgs)));
        } else if (type instanceof InterfaceType) {
            return new InterfaceType(type.decl, type.typeArguments.map(x => this.resolveClassGenericType(x, clsType, method, methodArgs)));
        } else if (type instanceof LambdaType) {
            return new LambdaType(
                type.parameters.map(x => new MethodParameter(x.name, this.resolveClassGenericType(x.type, clsType, method, methodArgs), x.initializer)),
                this.resolveClassGenericType(type.returnType, clsType, method, methodArgs));
        } else
            return type;
    }

    protected resolveInstanceMethodCallReturnType(expr: InstanceMethodCallExpression, intfType: IInterfaceType): Type {
        const typeArgResolve: Type[] = [];

        const mTypeArgs = expr.method.typeArguments;
        for (let i = 0; i < mTypeArgs.length; i++) {
            const actualTypes: Type[] = [];
            for (const arg of expr.args)
                if (arg instanceof Lambda && 
                    arg.declaredType instanceof LambdaType &&
                    arg.declaredType.returnType instanceof GenericsType &&
                    arg.declaredType.returnType.typeVarName === mTypeArgs[i])
                        actualTypes.push(arg.returns);

            // TODO: distinct
            if (actualTypes.length === 1)
                typeArgResolve.push(actualTypes[0]);
            else
                this.errorMan.throw(`Could not resolve GenericsType ${mTypeArgs[i]}`);
        }

        let returnType = this.resolveClassGenericType(expr.method.returns, intfType, expr.method, typeArgResolve);
        return returnType;
    }

    protected resolveGenericTypeFromActualType(genericType: Type, actualType: Type, result: Map<string, Type>): boolean {
        if (genericType instanceof GenericsType) {
            const prevRes = result.get(genericType.typeVarName) || null;
            if (prevRes !== null && !Type.equals(prevRes, actualType))
                throw new Error(`Resolving ${genericType.repr()} is ambiguous, ${prevRes.repr()} <> ${actualType.repr()}`);
            result.set(genericType.typeVarName, actualType);
            return true;
        } else if (genericType instanceof ClassType && actualType instanceof ClassType && genericType.decl === actualType.decl) {
            if (genericType.typeArguments.length !== actualType.typeArguments.length)
                throw new Error(`Same class used with different number of type arguments (${genericType.typeArguments.length} <> ${actualType.typeArguments.length})`);
            return genericType.typeArguments.every((x, i) => this.resolveGenericTypeFromActualType(x, actualType.typeArguments[i], result));
        }
        return false;
    }

    protected resolveGenericTypesFromMethodArguments(method: Method, args: Expression[], strict = true): Type[] {
        const resolutions = new Map<string, Type>();
        
        if (method.parameters.length !== args.length)
            throw new Error(`Expected ${method.parameters.length} arguments for ${method.parentInterface.name}::${method.name} call, but only got ${args.length}`);
        
        for (let i = 0; i < args.length; i++) {
            const argType = args[i].getType();
            if (!this.resolveGenericTypeFromActualType(method.parameters[i].type, argType, resolutions) && strict)
                throw new Error("Failed to resolve generic type");
        }

        const result: Type[] = [];
        for (const typeArg of method.typeArguments) {
            const actualType = resolutions.get(typeArg) || null;
            if (actualType === null) {
                if (strict)
                    throw new Error(`Failed to resolve generic type: ${typeArg}`);
                else
                    result.push(AnyType.instance);
            }
            result.push(actualType);
        }
        return result;
    }

    protected visitExpression(expr: Expression): Expression {
        if (expr instanceof NewExpression) {
            const params = expr.cls.decl.constructor_ ? expr.cls.decl.constructor_.parameters : [];
            if (expr.args.length !== params.length) {
                this.errorMan.throw(`Constructor (${expr.cls.repr()}) expects ${params.length} arguments, but was called with ${expr.args.length} arguments`);
            } else {
                for (let i = 0; i < expr.args.length; i++)
                    expr.args[i].setDeclaredType(params[i].type);
            }
        }

        if (expr instanceof CastExpression && (expr.expression instanceof MapLiteral || expr.expression instanceof ArrayLiteral))
            expr.expression.setDeclaredType(expr.newType);

        if (expr instanceof UnresolvedCallExpression) {
            expr.method = this.visitExpression(expr.method) || expr.method;
            if (expr.method instanceof StaticMethodReference || expr.method instanceof InstanceMethodReference || expr.method instanceof GlobalFunctionReference) {
                if (expr.method instanceof InstanceMethodReference && expr.method.method.name === "visitObjectMap") debugger;
                const methodBase = (<IGetMethodBase> expr.method).getMethodBase();
                // TODO: support method overloads...
                if (expr.args.length > methodBase.parameters.length)
                    this.errorMan.throw(`Expected ${methodBase.parameters.length} parameters, but got ${expr.args.length}`);
                else {
                    let methodArgs: Type[] = null;
                    if (expr.method instanceof InstanceMethodReference)
                        methodArgs = this.resolveGenericTypesFromMethodArguments(expr.method.method, expr.args, false);

                    for (let i = 0; i < expr.args.length; i++) {
                        let paramType = methodBase.parameters[i].type;
                        if (expr.method instanceof InstanceMethodReference) {
                            const objType = expr.method.object.getType();
                            if (!(objType instanceof ClassType || objType instanceof InterfaceType))
                                this.errorMan.throw("Instance method call can only happen on a ClassType or an InterfaceType object!");
                            else {
                                paramType = this.resolveClassGenericType(paramType, objType, expr.method.method, methodArgs);
                            }
                        }
                        expr.args[i].setDeclaredType(paramType);
                    }
                }
            }

            if (expr.method instanceof StaticMethodReference) {
                expr.args = expr.args.map(x => this.visitExpression(x) || x);
                expr = new StaticMethodCallExpression(expr.method.decl, expr.typeArgs, expr.args);
            } else if (expr.method instanceof InstanceMethodReference) {
                expr.args = expr.args.map(x => this.visitExpression(x) || x);
                expr = new InstanceMethodCallExpression(expr.method.object, expr.method.method, expr.typeArgs, expr.args);
            } else if (expr.method instanceof GlobalFunctionReference) {
                expr.args = expr.args.map(x => this.visitExpression(x) || x);
                expr = new GlobalFunctionCallExpression(expr.method.decl, expr.args);
            } else if (expr.method instanceof SuperReference) {
                expr = new TodoExpression(expr);
            } else if (expr.method.getType() instanceof LambdaType) {
                expr = new LambdaCallExpression(expr.method, expr.args);
            } else
                throw new Error("Invalid method call!");
        } else {
            super.visitExpression(expr);
        }

        if (expr instanceof PropertyAccessExpression)
            expr = this.inferPropertyAccess(expr) || expr;
        
        if (expr instanceof ConditionalExpression) {
            if (expr.whenTrue instanceof NullLiteral)
                expr.whenTrue.setActualType(expr.whenFalse.getType() || expr.getType());

            if (expr.whenFalse instanceof NullLiteral)
                expr.whenFalse.setActualType(expr.whenTrue.getType() || expr.getType());
        }

        if (expr instanceof BinaryExpression && (expr.operator === "==" || expr.operator === "!=")) {
            if (expr.left instanceof NullLiteral)
                expr.left.setActualType(expr.right.getType());
            else if (expr.right instanceof NullLiteral)
                expr.right.setActualType(expr.left.getType());
        }

        // TODO: TS-specific
        if (expr instanceof BinaryExpression && expr.operator === "||") {
            const leftType = expr.left.getType();
            const rightType = expr.right.getType();
            if (expr.right instanceof NullLiteral) { // something-which-can-be-undefined || null
                return expr.left;
            } else if (Type.isAssignableTo(rightType, leftType) && !Type.equals(rightType, this.currentFile.literalTypes.boolean))
                expr = new NullCoalesceExpression(expr.left, expr.right);
        }

        if (expr instanceof CastExpression) {
            expr.setActualType(expr.newType);
        } else if (expr instanceof ParenthesizedExpression) {
            expr.setActualType(expr.expression.getType());
        } else if (expr instanceof ThisReference) {
            expr.setActualType(expr.cls.type); // remove type arguments from this
        } else if (expr instanceof MethodParameterReference) {
            expr.setActualType(expr.decl.type || expr.declaredType);
        } else if (expr instanceof InstanceFieldReference) {
            expr.setActualType(expr.field.type);
        } else if (expr instanceof InstancePropertyReference) {
            expr.setActualType(expr.property.type);
        } else if (expr instanceof StaticPropertyReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof StaticFieldReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof EnumReference) {
            // EnumReference does not have type (only its members)
        } else if (expr instanceof EnumMemberReference) {
            expr.setActualType(expr.decl.parentEnum.type);
        } else if (expr instanceof BooleanLiteral) {
            expr.setActualType(this.currentFile.literalTypes.boolean);
        } else if (expr instanceof NumericLiteral) {
            expr.setActualType(this.currentFile.literalTypes.numeric);
        } else if (expr instanceof StringLiteral || expr instanceof TemplateString) {
            expr.setActualType(this.currentFile.literalTypes.string);
        } else if (expr instanceof RegexLiteral) {
            expr.setActualType(this.currentFile.literalTypes.regex);
        } else if (expr instanceof ArrayLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items, expr.declaredType, false);
            expr.setActualType(new ClassType(this.currentFile.literalTypes.array.decl, [itemType]));
        } else if (expr instanceof MapLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items.map(x => x.value), expr.declaredType, true);
            expr.setActualType(new ClassType(this.currentFile.literalTypes.map.decl, [itemType]));
        } else if (expr instanceof InstanceMethodReference || expr instanceof StaticMethodReference || expr instanceof GlobalFunctionReference) {
            // it does not have type, it will be called
        } else if (expr instanceof InstanceOfExpression) {
            expr.setActualType(this.currentFile.literalTypes.boolean);
        } else if (expr instanceof InstanceMethodCallExpression) {
            const objType = expr.object.getType();
            if (!(objType instanceof ClassType || objType instanceof InterfaceType))
                this.errorMan.throw("Instance method call can only happen on a ClassType or an InterfaceType object!");
            else {
                const returnType = this.resolveInstanceMethodCallReturnType(expr, <IInterfaceType> objType);
                if (returnType !== null)
                    expr.setActualType(returnType, true, Type.isGeneric(objType));
                else {
                    this.errorMan.throw(`Method's (${expr.method.parentInterface.name}::${expr.method.name}) return type is missing.`);
                    expr.setActualType(AnyType.instance);
                }
            }
        } else if (expr instanceof StaticMethodCallExpression) {
            if (expr.method.returns !== null) {
                let returnType = expr.method.returns;
                if (Type.isGeneric(returnType)) {
                    const methodActualTypes = this.resolveGenericTypesFromMethodArguments(expr.method, expr.args);
                    returnType = this.resolveClassGenericType(returnType, new ClassType(<Class>expr.method.parentInterface), expr.method, methodActualTypes);
                }
                expr.setActualType(returnType, true, expr.method.typeArguments.length > 0);
            } else
                this.errorMan.throw(`Static method's (${expr.method.parentInterface.name}::${expr.method.name}) return type is missing.`);
        } else if (expr instanceof GlobalFunctionCallExpression) {
            if (expr.method.returns !== null)
                expr.setActualType(expr.method.returns, true);
            else
                this.errorMan.throw(`Global function's (${expr.method.name}) return type is missing.`);
        } else if (expr instanceof NullLiteral) {
            if (expr.getType() === null)
                this.errorMan.throw("NullLiteral does not have type!");
        } else if (expr instanceof VariableDeclarationReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof ForeachVariableReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof ForVariableReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof UnaryExpression) {
            const operandType = expr.operand.getType();
            if (operandType instanceof ClassType) {
                const opId = `${expr.operator}${operandType.decl.name}`;

                if (opId === "-TsNumber") {
                    expr.setActualType(this.currentFile.literalTypes.numeric);
                } else if (opId === "!TsBoolean") {
                    expr.setActualType(this.currentFile.literalTypes.boolean);
                } else if (opId === "++TsNumber") {
                    expr.setActualType(this.currentFile.literalTypes.numeric);
                } else if (opId === "--TsNumber") {
                    expr.setActualType(this.currentFile.literalTypes.numeric);
                } else {
                    debugger;
                }
            } else if (operandType instanceof AnyType) {
                expr.setActualType(AnyType.instance);
            } else {
                debugger;
            }
        } else if (expr instanceof BinaryExpression) {
            const leftType = expr.left.getType();
            const rightType = expr.right.getType();
            const isEqOrNeq = expr.operator === "==" || expr.operator === "!=";
            if (expr.operator === "=") {
                if (Type.isAssignableTo(rightType, leftType))
                    expr.setActualType(leftType);
                else
                    throw new Error(`Right-side expression (${rightType.repr()}) is not assignable to left-side (${leftType.repr()}).`);
            } else if (isEqOrNeq && (leftType instanceof AnyType || rightType instanceof AnyType)) {
                expr.setActualType(this.currentFile.literalTypes.boolean);
            } else if (leftType instanceof ClassType && rightType instanceof ClassType) {
                const opId = `${leftType.decl.name} ${expr.operator} ${rightType.decl.name}`;

                const l = this.currentFile.literalTypes;

                if (leftType.decl === l.numeric.decl && rightType.decl === l.numeric.decl && ["-", "+", "-=", "+=", "%"].includes(expr.operator))
                    expr.setActualType(this.currentFile.literalTypes.numeric);
                else if (leftType.decl === l.numeric.decl && rightType.decl === l.numeric.decl && ["<", "<=", ">", ">="].includes(expr.operator))
                    expr.setActualType(this.currentFile.literalTypes.boolean);
                else if (leftType.decl === l.string.decl && rightType.decl === l.string.decl && ["+", "+="].includes(expr.operator))
                    expr.setActualType(this.currentFile.literalTypes.string);
                else if (leftType.decl === l.boolean.decl && rightType.decl === l.boolean.decl && ["||", "&&"].includes(expr.operator))
                    expr.setActualType(this.currentFile.literalTypes.boolean);
                else if (leftType.decl === rightType.decl && isEqOrNeq)
                    expr.setActualType(this.currentFile.literalTypes.boolean);
                else {
                    debugger;
                }
            } else if ((leftType instanceof ClassType || leftType instanceof InterfaceType) && expr.right instanceof NullLiteral && isEqOrNeq) {
                expr.setActualType(this.currentFile.literalTypes.boolean);
            } else if (leftType instanceof EnumType && rightType instanceof EnumType) {
                if (leftType.decl === rightType.decl && isEqOrNeq)
                    expr.setActualType(this.currentFile.literalTypes.boolean);
                else
                    debugger;
            } else {
                debugger;
            }
        } else if (expr instanceof ConditionalExpression) {
            const trueType = expr.whenTrue.getType();
            const falseType = expr.whenFalse.getType();
            if (Type.equals(trueType, falseType))
                expr.setActualType(trueType);
            else
                throw new Error(`Different types in the whenTrue (${trueType.repr()}) and whenFalse (${falseType.repr()}) expressions of a conditional expression`);
        } else if (expr instanceof PropertyAccessExpression) {
            // PropertyAccess resolution failed, we don't know the type...
            this.errorMan.warn("Could not determine PropertyAccess' type, using AnyType");
            expr.setActualType(AnyType.instance);
        } else if (expr instanceof NewExpression) {
            expr.setActualType(expr.cls);
        } else if (expr instanceof ClassReference) {
            // DO NOTHING
        } else if (expr instanceof ElementAccessExpression) {
            this.errorMan.throw("Element access is not supported at this step.");
        } else if (expr instanceof NullCoalesceExpression) {
            const defaultType = expr.defaultExpr.getType();
            const ifNullType = expr.exprIfNull.getType();
            if (!Type.isAssignableTo(ifNullType, defaultType))
                this.errorMan.throw(`Null-coalescing operator tried to assign incompatible type "${ifNullType.repr()}" to "${defaultType.repr()}"`);
            else 
                expr.setActualType(defaultType);
        } else if (expr instanceof SuperReference) {
            // TODO
            this.errorMan.throw("SuperReference is not implemented yet.");
        } else if (expr instanceof Lambda) {
            // TODO: why this is called???
            this.errorMan.throw("TODO: Why Lambda is processed here??");
        } else if (expr instanceof LambdaCallExpression) {
            const lambdaType = expr.method.getType();
            if (lambdaType instanceof LambdaType)
                expr.setActualType(lambdaType.returnType, true);
            else
                this.errorMan.throw("Lambda call's expression should have LambdaType type");
        } else if (expr instanceof TodoExpression) {
            // TODO
            this.errorMan.throw("This expression is not implemented yet. Using AnyType.");
            expr.setActualType(AnyType.instance);
        } else {
            debugger;
        }

        return expr;
    }

    startReturnTypeInfering() {
        this.methodReturnTypesStack.push([]);
    }

    finishReturnTypeInfering(declaredType: Type, errorContext: string): Type {
        let returnType: Type = null;

        const retTypes = this.methodReturnTypesStack.pop();
        if (retTypes.length == 0) {
            returnType = VoidType.instance;
        } else if (retTypes.length == 1) {
            returnType = retTypes[0];
        } else {
            if (declaredType !== null && retTypes.every(x => Type.isAssignableTo(x, declaredType)))
                returnType = declaredType;
            else {
                this.errorMan.throw(`${errorContext} returns different types: ${retTypes.map(x => x.repr()).join(", ")}`);
                returnType = AnyType.instance;
            }
        }

        if (declaredType !== null && !Type.isAssignableTo(returnType, declaredType))
            this.errorMan.throw(`${errorContext} returns different type (${returnType.repr()}) than expected ${declaredType.repr()}`);

        return returnType;
    }

    protected visitProperty(prop: Property) {
        if (this.doNotVisitFieldsAndProps) return;
        this.visitVariable(prop);

        if (prop.getter) {
            this.startReturnTypeInfering();
            this.visitBlock(prop.getter);
            prop.type = this.finishReturnTypeInfering(prop.type, `Property "${prop.name}"`);
        }

        if (prop.setter) {
            this.startReturnTypeInfering();
            this.visitBlock(prop.setter);
            this.finishReturnTypeInfering(VoidType.instance, `Property "${prop.name}"`);
        }
    }

    protected visitField(field: Field) {
        if (this.doNotVisitFieldsAndProps) return;
        super.visitField(field);
    }

    protected visitConstructor(constructor: Constructor) {
        console.log(`processing method: ${constructor.parentClass.name}::constructor`);
        super.visitConstructor(constructor);
    }

    protected visitMethod(method: Method) {
        console.log(`processing method: ${method.parentInterface.name}::${method.name}`);
        if (method.body) {
            this.startReturnTypeInfering();
            super.visitMethod(method);
            method.returns = this.finishReturnTypeInfering(method.returns, `Method "${method.name}"`);
        } else {
            super.visitMethod(method);
        }
    }

    public visitPackage(pkg: Package) {
        this.doNotVisitFieldsAndProps = false;
        for (const file of Object.values(pkg.files)) {
            this.currentFile = file;
            this.errorMan.resetContext(this);
            console.log(`processing fields: ${file.sourcePath.path}`);
            for (const cls of file.classes.values())
                for (const field of cls.fields.values())
                    this.visitField(field);
        }

        for (const file of Object.values(pkg.files)) {
            this.currentFile = file;
            this.errorMan.resetContext(this);
            console.log(`processing properties: ${file.sourcePath.path}`);
            for (const cls of file.classes.values())
                for (const prop of cls.properties.values())
                    this.visitProperty(prop);
        }

        console.log(`processing methods...`);
        this.doNotVisitFieldsAndProps = true;
        for (const file of Object.values(pkg.files))
            if (!/ExprLangVM|LangFilePreprocessor/.exec(file.sourcePath.path))
                this.visitSourceFile(file);
    }
}