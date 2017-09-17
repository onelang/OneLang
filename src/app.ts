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
import { SchemaContext } from "./One/SchemaContext";
import { FillNameTransform } from "./One/Transformers/FillNameTransform";
import { SchemaTransformer } from "./One/SchemaTransformer";
import { FillParentTransform } from "./One/Transformers/FillParentTransform";
import { FillMetaPathTransform } from "./One/Transformers/FillMetaPathTransform";

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

function saveSchemaState(schemaCtx: SchemaContext, name: string) {
    const schemaJson = JSON.stringify(schema, (k, v) => k === "parent" ? undefined : v, 4);
    const schemaOverview = new OverviewGenerator(schemaCtx).generate();
    fs.writeFileSync(`tmp/${name}.json`, schemaJson);
    fs.writeFileSync(`tmp/${name}.txt`, schemaOverview);
}

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());

const schemaCtx = new SchemaContext(schema);
schemaCtx.ensureTransforms("fillParent");
schemaCtx.ensureTransforms("fillMetaPath");
const tsToOneCtx = new SchemaContext(tsToOne);

//new TypeInferer(tsToOne).process();
saveSchemaState(tsToOneCtx, "tsToOne");

//saveSchemaState(schema, "tsOneSchema");

tsToOne.classes["TsArray"].meta = { iteratable: true };
new TypeInferer(schemaCtx, tsToOneCtx).process();
//new IdentifierResolver(schema).process();

saveSchemaState(schemaCtx, "tsOneResolvedSchema");

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
