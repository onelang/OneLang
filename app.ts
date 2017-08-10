import fs = require("fs");
import { KSLangSchema as ks } from "./KSLangSchema";
import { TypeScriptParser } from "./TypeScriptParser";

const sourceCode = fs.readFileSync("input/Test.ts", "utf8");
const schema = TypeScriptParser.parseFile(sourceCode);
const schemaJson = JSON.stringify(schema, function (k,v) {
    if (["enums", "classes", "items", "methods", "fields"].indexOf(k) !== -1 && Object.keys(v).length === 0) return undefined;
    return v;
}, 4);
//console.log(schemaJson);

const methods = {};
for (let clsName of Object.keys(schema.classes)) {
    const cls = schema.classes[clsName];
    methods[`${clsName}::constructor`] = cls.constructor.body;

    for (let methodName of Object.keys(cls.methods))
        methods[`${clsName}::${methodName}`] = cls.methods[methodName].body;
}

const astJson = JSON.stringify(methods, null, 4);
console.log(astJson);

fs.writeFileSync("ast.json", astJson);

debugger;

