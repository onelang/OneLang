import { AstTransformer } from "../AstTransformer";
import { ErrorManager } from "../ErrorManager";
import { PropertyAccessExpression, Expression, CastExpression, ParenthesizedExpression, BinaryExpression, StringLiteral, UnresolvedCallExpression, StaticMethodCallExpression, InstanceMethodCallExpression, ConditionalExpression, InstanceOfExpression, RegexLiteral, TemplateString, NumericLiteral, NewExpression, ArrayLiteral, MapLiteral, NullLiteral, UnaryExpression, BooleanLiteral, ElementAccessExpression } from "../Ast/Expressions";
import { ClassReference, StaticFieldReference, StaticPropertyReference, StaticMethodReference, SuperReference, ThisReference, ForeachVariableReference, ForVariableReference, VariableDeclarationReference, InstanceFieldReference, InstancePropertyReference, InstanceMethodReference, MethodParameterReference, EnumReference, EnumMemberReference, Reference } from "../Ast/References";
import { SourceFile, Class, Method, IVariableWithInitializer, Workspace, Package, Property, Field, Constructor } from "../Ast/Types";
import { ClassType, InterfaceType, AnyType, Type, VoidType, GenericsType, EnumType } from "../Ast/AstTypes";
import { Statement, VariableDeclaration, ReturnStatement } from "../Ast/Statements";

export class InferTypes extends AstTransformer<void> {
    file: SourceFile;
    currentMethod: Method;
    methodReturnTypes: Type[];
    protected doNotVisitFieldsAndProps = false;

    constructor(public errorMan = new ErrorManager()) { super(); }

    protected getStaticRef(cls: Class, memberName: string): Reference {
        const field = cls.fields.get(memberName);
        if (field && field.isStatic)
            return new StaticFieldReference(field);

        const prop = cls.properties.get(memberName);
        if (prop && prop.isStatic)
            return new StaticPropertyReference(prop);

        const method = cls.methods.get(memberName);
        if (method && method.isStatic)
            return new StaticMethodReference(method);

        return this.errorMan.throw(`Could not resolve static member access of a class: ${cls.name}::${memberName}`);
    }

    protected getInstanceRef(cls: Class, memberName: string, obj: Expression): Reference {
        const field = cls.fields.get(memberName);
        if (field && !field.isStatic)
            return new InstanceFieldReference(obj, field);

        const prop = cls.properties.get(memberName);
        if (prop && !prop.isStatic)
            return new InstancePropertyReference(obj, prop);

        const method = cls.methods.get(memberName);
        if (method && !method.isStatic)
            return new InstanceMethodReference(obj, method);

        this.errorMan.throw(`Could not resolve instance member access of a class: ${cls.name}::${memberName}`);
    }

    protected inferPropertyAccess(expr: PropertyAccessExpression): Expression {
        if (expr.object instanceof EnumReference) {
            const member = expr.object.decl.values.get(expr.propertyName);
            if (!member)
                return this.errorMan.throw(`Enum member was not found: ${expr.object.decl.name}::${expr.propertyName}`);
            return new EnumMemberReference(member);
        }

        if (expr.object instanceof ClassReference)
            return this.getStaticRef(expr.object.decl, expr.propertyName);

        if (expr.object instanceof ThisReference && this.currentMethod && this.currentMethod.isStatic)
            return this.getStaticRef(expr.object.cls, expr.propertyName);

        if (expr.object instanceof SuperReference ||
            expr.object instanceof ThisReference) {
                return this.getInstanceRef(expr.object.cls, expr.propertyName, expr.object);
        }

        const type = expr.object.getType();
        if (type instanceof ClassType) {
            return this.getInstanceRef(type.decl, expr.propertyName, expr.object);
        } else if (type instanceof InterfaceType) {
            // TODO: implement "if (interfaceVarName instanceof SpecificClass) { ...interfaceVarName is now type of SpecificClass... }"
            return this.errorMan.throw(`InterfaceType is not implemented yet`);
        } else if (!type) {
            return this.errorMan.throw(`Type was not inferred yet (prop="${expr.propertyName}")`);
        } else if (type instanceof AnyType) {
            return this.errorMan.throw(`Object has any type (prop="${expr.propertyName}")`);
        } else {
            return this.errorMan.throw(`Expected class as variable type, but got: ${type.constructor.name} (prop="${expr.propertyName}")`);
        }
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer): IVariableWithInitializer {
        super.visitVariableWithInitializer(variable);
        if (!variable.type)
            variable.type = variable.initializer.getType();
        return null;
    }


    protected visitStatement(stmt: Statement): Statement { 
        super.visitStatement(stmt);
        if (stmt instanceof ReturnStatement && stmt.expression !== null) {
            const returnType = stmt.expression.getType();
            if (!this.methodReturnTypes.some(x => Type.equals(x, returnType)))
                this.methodReturnTypes.push(returnType);
        }
        return null;
    }

    protected inferArrayOrMapItemType(items: Expression[], declaredType: Type, isMap: boolean) {
        const itemTypes: Type[] = [];
        for (const item of items)
            if (!itemTypes.some(t => Type.equals(t, item.getType())))
                itemTypes.push(item.getType());

        const literalType = isMap ? this.file.literalTypes.map : this.file.literalTypes.array;

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
            this.errorMan.warn(`Could not determine the type of ${isMap ? "a MapLiteral" : "an ArrayLiteral"}! Multiple types were found: ${itemTypes}. Will use AnyType instead.`);
            itemType = AnyType.instance;
        }
        return itemType;

    }

    protected visitExpression(expr: Expression): Expression {
        if (expr instanceof NewExpression) {
            const params = expr.cls.decl.constructor_ ? expr.cls.decl.constructor_.parameters : [];
            if (expr.args.length !== params.length) {
                this.errorMan.throw(`Constructor expects ${params.length} arguments, but was called with ${expr.args.length} arguments`);
            } else {
                for (let i = 0; i < expr.args.length; i++)
                    expr.args[i].setDeclaredType(params[i].type);
            }
        }

        if (expr instanceof UnresolvedCallExpression) {
            expr.method = this.visitExpression(expr.method);
            if (expr.method instanceof StaticMethodReference)
                expr = new StaticMethodCallExpression(expr.method.decl, expr.typeArgs, expr.args);
            else if (expr.method instanceof InstanceMethodReference)
                expr = new InstanceMethodCallExpression(expr.method.object, expr.method.method, expr.typeArgs, expr.args);
            else
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

        if (expr instanceof CastExpression) {
            expr.setActualType(expr.newType);
        } else if (expr instanceof ParenthesizedExpression) {
            expr.setActualType(expr.expression.getType());
        } else if (expr instanceof ThisReference) {
            expr.setActualType(expr.cls.type);
        } else if (expr instanceof MethodParameterReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof InstanceFieldReference) {
            expr.setActualType(expr.field.type);
        } else if (expr instanceof InstancePropertyReference) {
            expr.setActualType(expr.property.type);
        } else if (expr instanceof EnumReference) {
            // EnumReference does not have type (only its members)
        } else if (expr instanceof EnumMemberReference) {
            expr.setActualType(expr.decl.parentEnum.type);
        } else if (expr instanceof BooleanLiteral) {
            expr.setActualType(this.file.literalTypes.boolean);
        } else if (expr instanceof NumericLiteral) {
            expr.setActualType(this.file.literalTypes.numeric);
        } else if (expr instanceof StringLiteral || expr instanceof TemplateString) {
            expr.setActualType(this.file.literalTypes.string);
        } else if (expr instanceof RegexLiteral) {
            expr.setActualType(this.file.literalTypes.regex);
        } else if (expr instanceof ArrayLiteral) {
            const itemType = this.inferArrayOrMapItemType(expr.items, expr.declaredType, false);
            expr.setActualType(new ClassType(this.file.literalTypes.array.decl, [itemType]));
        } else if (expr instanceof MapLiteral) {
            const itemType = this.inferArrayOrMapItemType(Array.from(expr.properties.values()), expr.declaredType, true);
            expr.setActualType(new ClassType(this.file.literalTypes.map.decl, [itemType]));
        } else if (expr instanceof InstanceMethodReference || expr instanceof StaticMethodReference) {
            // it does not have type, it will be called
        } else if (expr instanceof InstanceOfExpression) {
            expr.setActualType(this.file.literalTypes.boolean);
        } else if (expr instanceof InstanceMethodCallExpression) {
            let returnType = expr.method.returns;
            if (returnType instanceof GenericsType) {
                const classType = expr.object.getType();
                if (classType instanceof ClassType) {
                    const classTypeArgs = classType.decl.typeArguments;
                    const typeArgIdx = classTypeArgs.indexOf(returnType.typeVarName);
                    if (classTypeArgs.length !== classType.typeArguments.length)
                        throw new Error("Type arguments don't match!");
                    returnType = classType.typeArguments[typeArgIdx];
                } else {
                    throw new Error("Expected ClassType here!");
                }
            }
            expr.setActualType(returnType);
        } else if (expr instanceof StaticMethodCallExpression) {
            expr.setActualType(expr.method.returns);
        } else if (expr instanceof NullLiteral) {
            if (expr.getType() === null)
                this.errorMan.throw("NullLiteral does not have type!");
        } else if (expr instanceof VariableDeclarationReference) {
            expr.setActualType(expr.decl.type);
        } else if (expr instanceof UnaryExpression) {
            const operandType = expr.operand.getType();
            if (operandType instanceof ClassType) {
                const opId = `${expr.operator}${operandType.decl.name}`;

                if (opId === "-TsNumber")
                    expr.setActualType(this.file.literalTypes.numeric);
                else {
                    debugger;
                }
            } else {
                debugger;
            }
        } else if (expr instanceof BinaryExpression) {
            const leftType = expr.left.getType();
            const rightType = expr.right.getType();
            const isEqOrNeq = expr.operator === "==" || expr.operator === "!=";
            if (expr.operator === "=") {
                if (Type.equals(leftType, rightType))
                    expr.setActualType(leftType);
                else
                    throw new Error("Different types on the left and right-side of the assignment.");
            } else if (leftType instanceof ClassType && rightType instanceof ClassType) {
                const opId = `${leftType.decl.name} ${expr.operator} ${rightType.decl.name}`;

                if (opId === "TsBoolean && TsBoolean")
                    expr.setActualType(this.file.literalTypes.boolean);
                else if (opId === "TsNumber - TsNumber")
                    expr.setActualType(this.file.literalTypes.numeric);
                else if (opId === "TsNumber >= TsNumber")
                    expr.setActualType(this.file.literalTypes.boolean);
                else if (opId === "TsString + TsString")
                    expr.setActualType(this.file.literalTypes.string);
                else if (opId === "TsString += TsString")
                    expr.setActualType(this.file.literalTypes.string);
                else if (leftType.decl === rightType.decl && isEqOrNeq)
                    expr.setActualType(this.file.literalTypes.boolean);
                else {
                    debugger;
                }
            } else if (leftType instanceof ClassType && expr.right instanceof NullLiteral && isEqOrNeq) {
                expr.setActualType(this.file.literalTypes.boolean);
            } else if (leftType instanceof EnumType && rightType instanceof EnumType) {
                if (leftType.decl === rightType.decl && isEqOrNeq)
                    expr.setActualType(this.file.literalTypes.boolean);
                else
                    debugger;
            } else {
                debugger;
            }
        } else if (expr instanceof ConditionalExpression) {
            if (Type.equals(expr.whenTrue.getType(), expr.whenFalse.getType()))
                expr.setActualType(expr.whenTrue.getType());
            else
                throw new Error("Different types in the whenTrue and whenFalse expressions of a conditional expression");
        } else if (expr instanceof PropertyAccessExpression) {
            // PropertyAccess resolution failed, we don't know the type...
            this.errorMan.warn("Could not determine PropertyAccess' type, using AnyType");
            expr.setActualType(AnyType.instance);
        } else if (expr instanceof NewExpression) {
            expr.setActualType(expr.cls.decl.type);
        } else if (expr instanceof ClassReference) {
            // DO NOTHING
        } else if (expr instanceof ElementAccessExpression) {
            this.errorMan.throw("Element access is not supported at this step.");
        } else {
            debugger;
        }

        return expr;
    }

    startReturnTypeInfering() {
        this.methodReturnTypes = [];
    }

    finishReturnTypeInfering(declaredType: Type, errorContext: string): Type {
        let returnType: Type = null;

        if (this.methodReturnTypes.length == 0) {
            returnType = VoidType.instance;
        } else if (this.methodReturnTypes.length == 1) {
            returnType = this.methodReturnTypes[0];
        } else {
            this.errorMan.throw(`${errorContext} returns different types: ${this.methodReturnTypes.map(x => x.repr()).join(", ")}`);
            returnType = AnyType.instance;
        }

        if (declaredType !== null && !Type.equals(declaredType, returnType))
            this.errorMan.throw(`${errorContext} returns different type (${returnType.repr()}) than expected ${declaredType}`);

        this.methodReturnTypes = null;
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
        if (field.type && field.initializer)
            field.initializer.setDeclaredType(field.type);
        super.visitField(field);
    }

    protected visitConstructor(constructor: Constructor) {
        super.visitConstructor(constructor);
    }

    protected visitMethod(method: Method) {
        this.currentMethod = method;
        this.startReturnTypeInfering();
        super.visitMethod(method);
        method.returns = this.finishReturnTypeInfering(method.returns, `Method "${method.name}"`);
        this.currentMethod = null;
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;
        this.errorMan.resetContext("InferTypes", sourceFile);
        super.visitSourceFile(sourceFile);
        this.errorMan.resetContext();
    }

    public visitPackage(pkg: Package) {
        this.doNotVisitFieldsAndProps = false;
        for (const file of Object.values(pkg.files)) {
            this.file = file;
            console.log(`processing fields: ${file.sourcePath.path}`);
            for (const cls of file.classes.values())
                for (const field of cls.fields.values())
                    this.visitField(field);
        }

        for (const file of Object.values(pkg.files)) {
            this.file = file;
            console.log(`processing properties: ${file.sourcePath.path}`);
            for (const cls of file.classes.values())
                for (const prop of cls.properties.values())
                    this.visitProperty(prop);
        }

        console.log(`processing methods...`);
        this.doNotVisitFieldsAndProps = true;
        super.visitPackage(pkg);
    }
}