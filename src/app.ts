require("./Utils/Extensions.js");
import fs = require("fs");
import YAML = require('yamljs');
import mkdirp = require('mkdirp');
import path = require('path');
import util = require('util');
import { TypeScriptParser } from "./Parsers/TypeScriptParser";
import { CodeGenerator } from "./Generator/CodeGenerator";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { OverviewGenerator } from "./One/OverviewGenerator";

class Utils {
    static writeFile(fn: string, data: any) {
        mkdirp.sync(path.dirname(fn));
        fs.writeFileSync(fn, data);
    }
}

const prgName = "Test";
const sourceCode = fs.readFileSync(`input/${prgName}.ts`, "utf8");
const tsOneSchema = TypeScriptParser.parseFile(sourceCode);
const tsOneSchemaJson = JSON.stringify(tsOneSchema, null, 4);
const tsOneSchemaOverview = new OverviewGenerator(tsOneSchema).generate();
fs.writeFileSync("tmp/tsOneSchema.json", tsOneSchemaJson);
fs.writeFileSync("tmp/tsOneSchema.txt", tsOneSchemaOverview);
//console.log(schemaJson);

//let langs = fs.readdirSync("langs");
//langs = ["csharp.yaml"];
//for (const langFn of langs) {
//    const langName = langFn.replace(".yaml", "");
//    const langSchema = <LangFileSchema.LangFile> YAML.parse(fs.readFileSync(`langs/${langFn}`, "utf8"));
//
//    const codeGenerator = new CodeGenerator(tsOneSchema, langSchema);
//
//    //const generatedCode = codeGenerator.generate(true);
//    //Utils.writeFile(`SamplePrograms/${prgName}/${prgName}.${langSchema.extension}`, generatedCode);
//
//    const overview = codeGenerator.generateOverview();
//    fs.writeFileSync("tmp/overview.txt", overview);
//    //console.log(overview);
//}
