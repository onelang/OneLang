import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";
import { CSharpParser } from "../Parsers/CSharpParser";
import { readFile, writeFile } from "../Utils/NodeUtils";
import { OneAst as ast } from "../One/Ast";
import { AstHelper } from "../One/AstHelper";
import { OneCompiler } from "../OneCompiler";
require("../Utils/Extensions.js");
const fs = require("fs");
global["YAML"] = require('yamljs'); 
declare var YAML;

const prgNames = fs.readdirSync("generated");
const prgExcludeList = ["stdlib", "overlay", "TemplateTests"];

const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

for (const ext of ["ts", "cs"]) {
    const langName = ext === "ts" ? "typescript" : "csharp";
    const overlayCode = readFile(`langs/NativeResolvers/${langName}.ts`);

    for (const prgName of prgNames) {
        if (prgExcludeList.includes(prgName)) continue;
        const fn = `generated/${prgName}/results/${prgName}.${ext}`;
        console.log(`Parsing '${fn}'...`);
        let content = readFile(fn);

        let schema: ast.Schema;
        if (ext === "ts") {
            content = content.split("\ntry {")[0]; // TODO: less hacky way of removing test code?
            content = content.replace(/one.Reflect.setupClass(.|\n)*?\n  \]\)\);\n/gm, "");
            content = content.replace(/const (\w+) = require\('\1'\);\n/gm, "");
            schema = TypeScriptParser2.parseFile(content);
        } else if (ext === "cs") {
            content = content.split("\npublic class Program")[0]; // TODO: less hacky way of removing test code?
            schema = CSharpParser.parseFile(content);
        }

        writeFile(`generated/${prgName}/regen/0_Original_${ext}.json`, AstHelper.toJson(schema));

        const compiler = new OneCompiler();
        compiler.parse(langName, content, overlayCode, stdlibCode, genericTransforms);
    }
}
