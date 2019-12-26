require("../Utils/Extensions.js");
const fs = require("fs");
import { writeFile, readFile } from "../../src/Utils/NodeUtils";
import { TypeScriptParser2 } from "../../src/Parsers/TypeScriptParser2";
import { ExpressionParser } from "../../src/Parsers/Common/ExpressionParser";
import { Reader } from "../../src/Parsers/Common/Reader";

//const expr = new ExpressionParser(new Reader("3 * 2 === 6")).parse();
//console.log(JSON.stringify(expr, null, 4));

let prgNames = fs.readdirSync("input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));
//prgNames = ["OneLang"];
for (const prgName of prgNames) {
    console.log(`parsing ${prgName}...`);
    const sourceCode = readFile(`input/${prgName}.ts`);
    TypeScriptParser2.parseFile(sourceCode);
}

console.log(`parsing StdLib...`);
TypeScriptParser2.parseFile(readFile(`langs/StdLibs/stdlib.d.ts`));

console.log(`parsing NativeResolver...`);
TypeScriptParser2.parseFile(readFile(`langs/NativeResolvers/typescript.ts`));
