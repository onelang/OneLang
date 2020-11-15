import { Expression, IMethodCallExpression, InstanceMethodCallExpression, NewExpression, StaticMethodCallExpression } from "../Ast/Expressions";
import { IMethodBase, IMethodBaseWithTrivia, MethodParameter } from "../Ast/Types";
import { AstTransformer } from "../AstTransformer";

export class UseDefaultCallArgsExplicitly extends AstTransformer {
    constructor() { super("UseDefaultCallArgsExplicitly"); }

    protected getNewArgs(args: Expression[], method: IMethodBaseWithTrivia): Expression[] {
        if ("UseDefaultCallArgsExplicitly" in method.attributes && method.attributes["UseDefaultCallArgsExplicitly"] === "disable") return args;
        if (args.length >= method.parameters.length) return args;

        const newArgs: Expression[] = [];
        for (let i = 0; i < method.parameters.length; i++) {
            const init = method.parameters[i].initializer;
            if (i >= args.length && init === null) {
                this.errorMan.throw(`Missing default value for parameter #${i + 1}!`);
                break;
            }
            newArgs.push(i < args.length ? args[i] : init);
        }
        return newArgs;
    }

    protected visitExpression(expr: Expression): Expression {
        super.visitExpression(expr);
        if (expr instanceof NewExpression && expr.cls.decl.constructor_ !== null) {
            expr.args = this.getNewArgs(expr.args, expr.cls.decl.constructor_);
        } else if (expr instanceof InstanceMethodCallExpression)
            expr.args = this.getNewArgs(expr.args, expr.method);
            else if (expr instanceof StaticMethodCallExpression)
            expr.args = this.getNewArgs(expr.args, expr.method);
        return expr;
    }
}