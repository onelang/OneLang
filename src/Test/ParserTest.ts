require("../Utils/Extensions.js");
const fs = require("fs");
import { writeFile, readFile } from "../Utils/NodeUtils";
import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { Reader } from "../Parsers/Common/Reader";

//const expr = new ExpressionParser(new Reader("3 * 2 === 6")).parse();
//console.log(JSON.stringify(expr, null, 4));

let prgNames = fs.readdirSync("input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));
//prgNames = ["OneLang"];
for (const prgName of prgNames) {
    console.log(`parsing ${prgName}...`);
    const sourceCode = readFile(`input/${prgName}.ts`);
    const parser = new TypeScriptParser2(sourceCode);
    const result = parser.parse();
    //console.log(result);
}
