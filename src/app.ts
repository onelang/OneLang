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
//import { IdentifierResolver } from "./One/IdentifierResolver";
import { InferTypesTransform } from "./One/Transforms/InferTypesTransform";
import { OneAst as one } from "./One/Ast";
import { SchemaContext } from "./One/SchemaContext";
import { FillNameTransform } from "./One/Transforms/FillNameTransform";
import { SchemaTransformer } from "./One/SchemaTransformer";
import { FillParentTransform } from "./One/Transforms/FillParentTransform";
import { FillMetaPathTransform } from "./One/Transforms/FillMetaPathTransform";
import { ResolveIdentifiersTransform } from "./One/Transforms/ResolveIdentifiersTransform";

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
    const schemaOverview = new OverviewGenerator(schemaCtx).generate();
    fs.writeFileSync(`tmp/${name}.txt`, schemaOverview);
    const schemaJson = JSON.stringify(schemaCtx.schema, (k, v) =>
        k === "parent" || k === "cls" || k === "method" ? undefined : v, 4);
    fs.writeFileSync(`tmp/${name}.json`, schemaJson);
}

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());
SchemaTransformer.instance.addTransform(new ResolveIdentifiersTransform());
SchemaTransformer.instance.addTransform(new InferTypesTransform());

const tsToOneCtx = new SchemaContext(tsToOne);
tsToOneCtx.ensureTransforms("fillName");
tsToOne.classes["TsArray"].meta = { iterable: true };

const schemaCtx = new SchemaContext(schema);
schemaCtx.addOverlaySchema(tsToOne);
schemaCtx.ensureTransforms("fillParent");
schemaCtx.ensureTransforms("fillMetaPath");
schemaCtx.ensureTransforms("inferTypes");

saveSchemaState(tsToOneCtx, "tsToOne");

//saveSchemaState(schema, "tsOneSchema");

//new TypeInferer(schemaCtx, tsToOneCtx).process();
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
