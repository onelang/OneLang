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
import { OneAst as one } from "./One/Ast";

class Utils {
    static writeFile(fn: string, data: any) {
        mkdirp.sync(path.dirname(fn));
        fs.writeFileSync(fn, data);
    }
}

function parseTs(fn: string): one.Schema {
    const sourceCode = fs.readFileSync(fn, "utf8");
    const ast = TypeScriptParser.parseFile(sourceCode);
    return ast;
}

const prgName = "Test";
const tsToOne = parseTs(`langs/NativeResolvers/typescript.ts`);
const schema = parseTs(`input/${prgName}.ts`);

function saveSchemaState(schema: one.Schema, name: string) {
    const schemaJson = JSON.stringify(schema, null, 4);
    const schemaOverview = new OverviewGenerator(schema).generate();
    fs.writeFileSync(`tmp/${name}.json`, schemaJson);
    fs.writeFileSync(`tmp/${name}.txt`, schemaOverview);
}

//new TypeInferer(tsToOne).process();
saveSchemaState(tsToOne, "tsToOne");

//saveSchemaState(schema, "tsOneSchema");

new TypeInferer(schema).process();
//new IdentifierResolver(schema).process();

//saveSchemaState(schema, "tsOneResolvedSchema");

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
