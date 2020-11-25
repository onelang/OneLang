import { IGeneratorPlugin } from "../IGeneratorPlugin";
import { InstanceMethodCallExpression, Expression, StaticMethodCallExpression, RegexLiteral } from "../../One/Ast/Expressions";
import { Statement } from "../../One/Ast/Statements";
import { ClassType } from "../../One/Ast/AstTypes";
import { Class, Method } from "../../One/Ast/Types";
import { IExpression } from "../../One/Ast/Interfaces";
import { JavaGenerator } from "../JavaGenerator";

export class JsToJava implements IGeneratorPlugin {
    unhandledMethods = new Set<string>();

    constructor(public main: JavaGenerator) { }

    convertMethod(cls: Class, obj: Expression, method: Method, args: Expression[]): string {
        const objR = obj === null ? null : this.main.expr(obj);
        const argsR = args.map(x => this.main.expr(x));
        if (cls.name === "TsString") {
            if (method.name === "replace") {
                if (args[0] instanceof RegexLiteral) {
                    this.main.imports.add("java.util.regex.Pattern");
                    return `${objR}.replaceAll(${JSON.stringify((<RegexLiteral>args[0]).pattern)}, ${argsR[1]})`;
                }

                return `${argsR[0]}.replace(${objR}, ${argsR[1]})`;
            }
        } else if (["console", "RegExp"].includes(cls.name)) {
            this.main.imports.add(`io.onelang.std.core.${cls.name}`);
            return null;
        } else if (["JSON"].includes(cls.name)) {
            this.main.imports.add(`io.onelang.std.json.${cls.name}`);
            return null;
        } else {
            return null;
        }

        return null;
    }

    expr(expr: IExpression): string {
        if (expr instanceof InstanceMethodCallExpression && expr.object.actualType instanceof ClassType) {
            return this.convertMethod(expr.object.actualType.decl, expr.object, expr.method, expr.args);
        } else if (expr instanceof StaticMethodCallExpression && expr.method.parentInterface instanceof Class) {
            return this.convertMethod(expr.method.parentInterface, null, expr.method, expr.args);
        }
        return null;
    }
    
    stmt(stmt: Statement): string {
        return null;
    }
}