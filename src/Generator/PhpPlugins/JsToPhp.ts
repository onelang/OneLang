import { IGeneratorPlugin } from "../IGeneratorPlugin";
import { InstanceMethodCallExpression, Expression, StaticMethodCallExpression, RegexLiteral } from "../../One/Ast/Expressions";
import { Statement } from "../../One/Ast/Statements";
import { ClassType, InterfaceType } from "../../One/Ast/AstTypes";
import { Class, Method } from "../../One/Ast/Types";
import { InstanceFieldReference, InstancePropertyReference } from "../../One/Ast/References";
import { IExpression } from "../../One/Ast/Interfaces";
import { PhpGenerator } from "../PhpGenerator";

export class JsToPhp implements IGeneratorPlugin {
    unhandledMethods = new Set<string>();

    constructor(public main: PhpGenerator) { }

    convertMethod(cls: Class, obj: Expression, method: Method, args: Expression[]): string {
        if (cls.name === "TsArray") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "includes") {
                return `in_array(${argsR[0]}, ${objR})`;
            } else if (method.name === "set") {
                return `${objR}[${argsR[0]}] = ${argsR[1]}`;
            } else if (method.name === "get") {
                return `${objR}[${argsR[0]}]`;
            } else if (method.name === "join") {
                return `implode(${argsR[0]}, ${objR})`;
            } else if (method.name === "map") {
                return `array_map(${argsR[0]}, ${objR})`;
            } else if (method.name === "push") {
                return `${objR}[] = ${argsR[0]}`;
            } else if (method.name === "pop") {
                return `array_pop(${objR})`;
            } else if (method.name === "filter") {
                return `array_values(array_filter(${objR}, ${argsR[0]}))`;
            } else if (method.name === "every") {
                return `\\OneLang\\ArrayHelper::every(${objR}, ${argsR[0]})`;
            } else if (method.name === "some") {
                return `\\OneLang\\ArrayHelper::some(${objR}, ${argsR[0]})`;
            } else if (method.name === "concat") {
                return `array_merge(${objR}, ${argsR[0]})`;
            } else if (method.name === "shift") {
                return `array_shift(${objR})`;
            } else if (method.name === "find") {
                return `\\OneLang\\ArrayHelper::find(${objR}, ${argsR[0]})`;
            }
        } else if (cls.name === "TsString") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "split") {
                if (args[0] instanceof RegexLiteral) {
                    const pattern = (<RegexLiteral>args[0]).pattern;
                    const modPattern = "/" + pattern.replace(/\//, "\\/") + "/";
                    return `preg_split(${JSON.stringify(modPattern)}, ${objR})`;
                }

                return `explode(${argsR[0]}, ${objR})`;
            } else if (method.name === "replace") {
                if (args[0] instanceof RegexLiteral) {
                    return `preg_replace(${JSON.stringify(`/${(<RegexLiteral>args[0]).pattern}/`)}, ${argsR[1]}, ${objR})`;
                }

                return `${argsR[0]}.replace(${objR}, ${argsR[1]})`;
            } else if (method.name === "includes") {
                return `strpos(${objR}, ${argsR[0]}) !== false`;
            } else if (method.name === "startsWith") {
                if (argsR.length > 1)
                    return `substr_compare(${objR}, ${argsR[0]}, ${argsR[1]}, strlen(${argsR[0]})) === 0`;
                else 
                    return `substr_compare(${objR}, ${argsR[0]}, 0, strlen(${argsR[0]})) === 0`;
            } else if (method.name === "endsWith") {
                if (argsR.length > 1)
                    return `substr_compare(${objR}, ${argsR[0]}, ${argsR[1]} - strlen(${argsR[0]}), strlen(${argsR[0]})) === 0`;
                else 
                    return `substr_compare(${objR}, ${argsR[0]}, strlen(${objR}) - strlen(${argsR[0]}), strlen(${argsR[0]})) === 0`;
            } else if (method.name === "indexOf") {
                return `strpos(${objR}, ${argsR[0]}, ${argsR[1]})`;
            } else if (method.name === "lastIndexOf") {
                return `strrpos(${objR}, ${argsR[0]}, ${argsR[1]} - strlen(${objR}))`;
            } else if (method.name === "substr") {
                if (argsR.length > 1)
                    return `substr(${objR}, ${argsR[0]}, ${argsR[1]})`;
                else
                    return `substr(${objR}, ${argsR[0]})`;
            } else if (method.name === "substring") {
                return `substr(${objR}, ${argsR[0]}, ${argsR[1]} - (${argsR[0]}))`;
            } else if (method.name === "repeat") {
                return `str_repeat(${objR}, ${argsR[0]})`;
            } else if (method.name === "toUpperCase") {
                return `strtoupper(${objR})`;
            } else if (method.name === "toLowerCase") {
                return `strtolower(${objR})`;
            //} else if (method.name === "endsWith") {
            //    return `${objR}.endswith(${argsR[0]})`;
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
                return `@${objR}[${argsR[0]}] ?? null`;
            } else if (method.name === "hasKey") {
                return `array_key_exists(${argsR[0]}, ${objR})`;
            }
        } else if (cls.name === "Object") {
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "keys") {
                return `array_keys(${argsR[0]})`;
            } else if (method.name === "values") {
                return `array_values(${argsR[0]})`;
            }
        // } else if (cls.name === "Set") {
        //     const objR = this.main.expr(obj);
        //     const argsR = args.map(x => this.main.expr(x));
        //     if (method.name === "values") {
        //         return `${objR}.keys()`;
        //     } else if (method.name === "has") {
        //         return `${argsR[0]} in ${objR}`;
        //     } else if (method.name === "add") {
        //         return `${objR}[${argsR[0]}] = None`;
        //     }
        } else if (cls.name === "ArrayHelper") {
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "sortBy") {
                return `\\OneLang\\ArrayHelper::sortBy(${argsR[0]}, ${argsR[1]})`;
            } else if (method.name === "removeLastN") {
                return `array_splice(${argsR[0]}, -${argsR[1]})`;
            }
        } else if (cls.name === "Math") {
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "floor")
                return `floor(${argsR[0]})`;
        } else if (cls.name === "JSON") {
            const argsR = args.map(x => this.main.expr(x));
            if (method.name === "stringify")
                return `json_encode(${argsR[0]}, JSON_UNESCAPED_SLASHES)`;
        } else if (cls.name === "RegExpExecArray") {
            const objR = this.main.expr(obj);
            const argsR = args.map(x => this.main.expr(x));
            return `${objR}[${argsR[0]}]`;
        } else {
            return null;
        }

        const methodName = `${cls.name}.${method.name}`;
        if (!this.unhandledMethods.has(methodName)) {
            console.error(`[JsToPython] Method was not handled: ${cls.name}.${method.name}`);
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
                return `strlen(${this.main.expr(expr.object)})`;
            if (expr.property.parentClass.name === "TsArray" && expr.property.name === "length")
                return `count(${this.main.expr(expr.object)})`;
        } else if (expr instanceof InstanceFieldReference && expr.object.actualType instanceof ClassType) {
            if (expr.field.parentInterface.name === "RegExpExecArray" && expr.field.name === "length")
                return `count(${this.main.expr(expr.object)})`;
        } else if (expr instanceof StaticMethodCallExpression && expr.method.parentInterface instanceof Class) {
            return this.convertMethod(expr.method.parentInterface, null, expr.method, expr.args);
        }
        return null;
    }
    
    stmt(stmt: Statement): string {
        return null;
    }

}