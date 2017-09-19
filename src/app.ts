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
import { InlineOverlayTypesTransform } from "./One/Transforms/InlineOverlayTypesTransform";
import { ConvertInlineThisRefTransform } from "./One/Transforms/ConvertInlineThisRefTransform";
import { AstHelper } from "./One/AstHelper";

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
    const schemaOverview = new OverviewGenerator().generate(schemaCtx);
    fs.writeFileSync(`tmp/${name}.txt`, schemaOverview);
    const schemaJson = AstHelper.toJson(schemaCtx.schema);
    fs.writeFileSync(`tmp/${name}.json`, schemaJson);
}

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());
SchemaTransformer.instance.addTransform(new ResolveIdentifiersTransform());
SchemaTransformer.instance.addTransform(new InferTypesTransform());
SchemaTransformer.instance.addTransform(new InlineOverlayTypesTransform());
SchemaTransformer.instance.addTransform(new ConvertInlineThisRefTransform());

const tsToOneCtx = new SchemaContext(tsToOne);
tsToOneCtx.ensureTransforms("inferTypes", "fillMetaPath", "convertInlineThisRef");
tsToOne.classes["TsArray"].meta = { iterable: true };
saveSchemaState(tsToOneCtx, "tsToOne");

const schemaCtx = new SchemaContext(schema);
saveSchemaState(schemaCtx, "Test_0_Original");

schemaCtx.addOverlaySchema(tsToOne);
schemaCtx.ensureTransforms("inferTypes");
saveSchemaState(schemaCtx, "Test_1_TypesInferred");

schemaCtx.ensureTransforms("inlineOverlayTypes");
saveSchemaState(schemaCtx, "Test_2_OverlayTypesInlined");

//new TypeInferer(schemaCtx, tsToOneCtx).process();
//new IdentifierResolver(schema).process();


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
