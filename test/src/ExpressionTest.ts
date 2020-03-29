import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";

function exprToJson(exprStr: string) {
    const expr = new TypeScriptParser2(exprStr).parseExpression();
    const json = JSON.stringify(expr, (k, v) => {
        if (v === null) return undefined;
        if (Array.isArray(v) || typeof v !== "object") return v;

        const res = {};
        res["$type"] = v.constructor.name;
        for (const key of Object.keys(v))
            res[key] = v[key];
        return res;
    }, 4);
    return json;
}

console.log(exprToJson("`\\``"));

