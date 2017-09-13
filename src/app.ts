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
import { IdentifierResolver } from "./One/IdentifierResolver";
import { TypeInferer } from "./One/TypeInferer";

class Utils {
    static writeFile(fn: string, data: any) {
        mkdirp.sync(path.dirname(fn));
        fs.writeFileSync(fn, data);
    }
}

const prgName = "Test";
const sourceCode = fs.readFileSync(`input/${prgName}.ts`, "utf8");
const schema = TypeScriptParser.parseFile(sourceCode);

function saveSchemaState(name: string) {
    const schemaJson = JSON.stringify(schema, null, 4);
    const schemaOverview = new OverviewGenerator(schema).generate();
    fs.writeFileSync(`tmp/${name}.json`, schemaJson);
    fs.writeFileSync(`tmp/${name}.txt`, schemaOverview);
}

saveSchemaState("tsOneSchema");

new TypeInferer(schema).process();
//new IdentifierResolver(schema).process();

saveSchemaState("tsOneResolvedSchema");

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
