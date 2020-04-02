import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { Expression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, StaticMethodCallExpression, IMethodCallExpression } from "../../Ast/Expressions";
import { ClassType, Type, IInterfaceType, InterfaceType, AnyType } from "../../Ast/AstTypes";
import { GenericsResolver } from "./Helpers/GenericsResolver";
import { ClassReference, ThisReference, SuperReference, StaticThisReference } from "../../Ast/References";
import { Class, IInterface, Method } from "../../Ast/Types";

export class ResolveMethodCalls extends InferTypesPlugin {
    constructor() { super("ResolveMethodCalls"); }

    protected findMethod(cls: IInterface, methodName: string, isStatic: boolean, args: Expression[]) {
        const allBases = cls instanceof Class ? cls.getAllBaseInterfaces().filter(x => x instanceof Class) : cls.getAllBaseInterfaces();
        
        const methods: Method[] = [];
        for (const base of allBases) {
            for (const m of base.methods) {
                const minLen = m.parameters.filter(p => p.initializer === null).length;
                const maxLen = m.parameters.length;
                const match = m.name === methodName && m.isStatic === isStatic && minLen <= args.length && args.length <= maxLen;
                if (match)
                    methods.push(m);
            }
        }
        
        if (methods.length === 0)
            throw new Error(`Method '${methodName}' was not found on type '${cls.name}' with ${args.length} arguments`);
        else if (methods.length > 1) {
            // TODO: actually we should implement proper method shadowing here...
            const thisMethods = methods.filter(x => x.parentInterface === cls);
            if (thisMethods.length === 1)
                return thisMethods[0];
            throw new Error(`Multiple methods found with name '${methodName}' and ${args.length} arguments on type '${cls.name}'`);
        }
        return methods[0];
    }

    protected resolveReturnType(expr: IMethodCallExpression, genericsResolver: GenericsResolver) {
        genericsResolver.collectFromMethodCall(expr);
        
        for (let i = 0; i < expr.args.length; i++) {
            // actually doesn't have to resolve, but must check if generic type confirm the previous argument with the same generic type
            const paramType = genericsResolver.resolveType(expr.method.parameters[i].type, false);
            if (paramType !== null)
                expr.args[i].setExpectedType(paramType);
            expr.args[i] = this.main.runPluginsOn(expr.args[i]);
            genericsResolver.collectResolutionsFromActualType(paramType, expr.args[i].actualType);
        }

        if (expr.method.returns === null) {
            this.errorMan.throw(`Method (${expr.method.parentInterface.name}::${expr.method.name}) return type was not specified or infered before the call.`);
            return;
        }

        expr.setActualType(genericsResolver.resolveType(expr.method.returns, true), true, expr instanceof InstanceMethodCallExpression && Type.isGeneric(expr.object.getType()));
    }
    
    protected transformMethodCall(expr: UnresolvedMethodCallExpression): Expression {
        if (expr.object instanceof ClassReference || expr.object instanceof StaticThisReference) {
            const cls = expr.object instanceof ClassReference ? expr.object.decl : expr.object instanceof StaticThisReference ? expr.object.cls : null;
            const method = this.findMethod(cls, expr.methodName, true, expr.args);
            const result = new StaticMethodCallExpression(method, expr.typeArgs, expr.args, expr.object instanceof StaticThisReference);
            this.resolveReturnType(result, new GenericsResolver());
            return result;
        } else {
            const resolvedObject = expr.object.actualType !== null ? expr.object : this.main.runPluginsOn(expr.object) || expr.object;
            const objectType = resolvedObject.getType();
            const intfType: IInterface = objectType instanceof ClassType ? <IInterface>objectType.decl : objectType 
                instanceof InterfaceType ? objectType.decl : null;

            if (intfType !== null) {
                const method = this.findMethod(intfType, expr.methodName, false, expr.args);
                const result = new InstanceMethodCallExpression(resolvedObject, method, expr.typeArgs, expr.args);
                this.resolveReturnType(result, GenericsResolver.fromObject(resolvedObject));
                return result;
            } else if (objectType instanceof AnyType) {
                expr.setActualType(AnyType.instance);
                return expr;
            } else {
                debugger;
            }
            return resolvedObject;
        }
    }

    canTransform(expr: Expression) { return expr instanceof UnresolvedMethodCallExpression && !(expr.actualType instanceof AnyType); }

    transform(expr: Expression): Expression {
        return this.transformMethodCall(<UnresolvedMethodCallExpression> expr);
    }
}