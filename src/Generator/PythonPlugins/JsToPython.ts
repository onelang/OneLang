import { IGeneratorPlugin } from "../IGeneratorPlugin";
import { InstanceMethodCallExpression, Expression, StaticMethodCallExpression, RegexLiteral } from "../../One/Ast/Expressions";
import { Statement } from "../../One/Ast/Statements";
import { ClassType, InterfaceType } from "../../One/Ast/AstTypes";
import { PythonGenerator } from "../PythonGenerator";
import { Class, Method } from "../../One/Ast/Types";
import { InstanceFieldReference, InstancePropertyReference } from "../../One/Ast/References";
import { IExpression } from "../../One/Ast/Interfaces";

export class JsToPython implements IGeneratorPlugin {
    unhandledMethods = new Set<string>();

    constructor(public main: PythonGenerator) { }

    convertMethod(cls: Class, obj: Expression, method: Method, args: Expression[]): string {
        if (cls.name === "TsArray") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "includes") {
                return `${argsR[0]} in ${objR}`;
            } else if (method.name === "set") {
                return `${objR}[${argsR[0]}] = ${argsR[1]}`;
            } else if (method.name === "get") {
                return `${objR}[${argsR[0]}]`;
            } else if (method.name === "join") {
                return `${argsR[0]}.join(${objR})`;
            } else if (method.name === "map") {
                return `list(map(${argsR[0]}, ${objR}))`;
            } else if (method.name === "push") {
                return `${objR}.append(${argsR[0]})`;
            } else if (method.name === "pop") {
                return `${objR}.pop()`;
            } else if (method.name === "filter") {
                return `list(filter(${argsR[0]}, ${objR}))`;
            } else if (method.name === "every") {
                return `ArrayHelper.every(${argsR[0]}, ${objR})`;
            } else if (method.name === "some") {
                return `ArrayHelper.some(${argsR[0]}, ${objR})`;
            } else if (method.name === "concat") {
                return `${objR} + ${argsR[0]}`;
            } else if (method.name === "shift") {
                return `${objR}.pop(0)`;
            } else if (method.name === "find") {
                return `next(filter(${argsR[0]}, ${objR}), None)`;
            }
        } else if (cls.name === "TsString") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "split") {
                if (args[0] instanceof RegexLiteral) {
                    const pattern = (<RegexLiteral>args[0]).pattern;
                    if (!pattern.startsWith("^")) {
                        //return `${objR}.split(${JSON.stringify(pattern)})`;
                        this.main.imports.add("import re");
                        return `re.split(${JSON.stringify(pattern)}, ${objR})`;
                    }
                }

                return `${argsR[0]}.split(${objR})`;
            } else if (method.name === "replace") {
                if (args[0] instanceof RegexLiteral) {
                    this.main.imports.add("import re");
                    return `re.sub(${JSON.stringify((<RegexLiteral>args[0]).pattern)}, ${argsR[1]}, ${objR})`;
                }

                return `${argsR[0]}.replace(${objR}, ${argsR[1]})`;
            } else if (method.name === "includes") {
                return `${argsR[0]} in ${objR}`;
            } else if (method.name === "startsWith") {
                return `${objR}.startswith(${argsR.join(", ")})`;
            } else if (method.name === "indexOf") {
                return `${objR}.find(${argsR[0]}, ${argsR[1]})`;
            } else if (method.name === "lastIndexOf") {
                return `${objR}.rfind(${argsR[0]}, 0, ${argsR[1]})`;
            } else if (method.name === "substr") {
                return argsR.length === 1 ? `${objR}[${argsR[0]}:]` : `${objR}[${argsR[0]}:${argsR[0]} + ${argsR[1]}]`;
            } else if (method.name === "substring") {
                return `${objR}[${argsR[0]}:${argsR[1]}]`;
            } else if (method.name === "repeat") {
                return `${objR} * (${argsR[0]})`;
            } else if (method.name === "toUpperCase") {
                return `${objR}.upper()`;
            } else if (method.name === "toLowerCase") {
                return `${objR}.lower()`;
            } else if (method.name === "endsWith") {
                return `${objR}.endswith(${argsR[0]})`;
            } else if (method.name === "get") {
                return `${objR}[${argsR[0]}]`;
            } else if (method.name === "charCodeAt") {
                return `ord(${objR}[${argsR[0]}])`;
            }
        } else if (cls.name === "TsMap") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "set") {
                return `${objR}[${argsR[0]}] = ${argsR[1]}`;
            } else if (method.name === "get") {
                return `${objR}.get(${argsR[0]})`;
            } else if (method.name === "hasKey") {
                return `${argsR[0]} in ${objR}`;
            }
        } else if (cls.name === "Object") {
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "keys") {
                return `${argsR[0]}.keys()`;
            } else if (method.name === "values") {
                return `${argsR[0]}.values()`;
            }
        } else if (cls.name === "Set") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "values") {
                return `${objR}.keys()`;
            } else if (method.name === "has") {
                return `${argsR[0]} in ${objR}`;
            } else if (method.name === "add") {
                return `${objR}[${argsR[0]}] = None`;
            }
        } else if (cls.name === "ArrayHelper") {
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "sortBy") {
                return `sorted(${argsR[0]}, key=${argsR[1]})`;
            } else if (method.name === "removeLastN") {
                return `del ${argsR[0]}[-${argsR[1]}:]`;
            }
        } else if (cls.name === "RegExpExecArray") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            return `${objR}[${argsR[0]}]`;
        } else {
            return null;
        }

        const methodName = `${cls.name}.${method.name}`;
        if (!this.unhandledMethods.has(methodName)) {
            console.error(`Method was not handled: ${cls.name}.${method.name}`);
            this.unhandledMethods.add(methodName);
        }
        //debugger;
        return null;
    }

    expr(expr: IExpression): string {
        if (expr instanceof InstanceMethodCallExpression && expr.object.actualType instanceof ClassType) {
            return this.convertMethod(expr.object.actualType.decl, expr.object, expr.method, expr.args);
        } else if (expr instanceof InstancePropertyReference && expr.object.actualType instanceof ClassType) {
            if (expr.property.parentClass.name === "TsString" && expr.property.name === "length")
                return `len(${this.main.expr(expr.object)})`;
            if (expr.property.parentClass.name === "TsArray" && expr.property.name === "length")
                return `len(${this.main.expr(expr.object)})`;
        } else if (expr instanceof InstanceFieldReference && expr.object.actualType instanceof ClassType) {
            if (expr.field.parentInterface.name === "RegExpExecArray" && expr.field.name === "length")
                return `len(${this.main.expr(expr.object)})`;
        } else if (expr instanceof StaticMethodCallExpression && expr.method.parentInterface instanceof Class) {
            return this.convertMethod(expr.method.parentInterface, null, expr.method, expr.args);
        }
        return null;
    }
    
    stmt(stmt: Statement): string {
        return null;
    }

}