require("./extensions.js");
import fs = require("fs");
import YAML = require('yamljs');
import mkdirp = require('mkdirp');
import path = require('path');
import util = require('util');
import { TypeScriptParser } from "./TypeScriptParser";
import { KsLangSchema, CodeGenerator } from "./CodeGenerator";

class Utils {
    static writeFile(fn: string, data: any) {
        mkdirp.sync(path.dirname(fn));
        fs.writeFileSync(fn, data);
    }
}

const prgName = "Test";
const sourceCode = fs.readFileSync(`input/${prgName}.ts`, "utf8");
const schema = TypeScriptParser.parseFile(sourceCode);
const schemaJson = JSON.stringify(schema, null, 4);
//console.log(schemaJson);
fs.writeFileSync("schema.json", schemaJson);

let langs = fs.readdirSync("langs");
langs = ["csharp.yaml"];
for (const langFn of langs) {
    const langName = langFn.replace(".yaml", "");
    const langSchema = <KsLangSchema.LangFile> YAML.parse(fs.readFileSync(`langs/${langFn}`, "utf8"));

    const codeGenerator = new CodeGenerator(schema, langSchema);

    const generatedCode = codeGenerator.generate(true);
    Utils.writeFile(`SamplePrograms/${prgName}/${prgName}.${langSchema.extension}`, generatedCode);

    const overview = codeGenerator.generateOverview();
    console.log(overview);
    debugger;
}
