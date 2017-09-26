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
import { CaseConverter } from "./One/Transforms/CaseConverter";

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
tsToOneCtx.ensureTransforms("convertInlineThisRef");
tsToOneCtx.ensureTransforms("fillMetaPath");
tsToOne.classes["TsArray"].meta = { iterable: true };
saveSchemaState(tsToOneCtx, "tsToOne");

const schemaCtx = new SchemaContext(schema);
saveSchemaState(schemaCtx, `${prgName}_0_Original`);

schemaCtx.addOverlaySchema(tsToOne);
schemaCtx.ensureTransforms("inferTypes");
saveSchemaState(schemaCtx, `${prgName}_1_TypesInferred`);

schemaCtx.ensureTransforms("inlineOverlayTypes");
saveSchemaState(schemaCtx, `${prgName}_2_OverlayTypesInlined`);

function loadLangSchema(name: string) {
    const langSchema = <LangFileSchema.LangFile> YAML.parse(fs.readFileSync(`langs/${name}.yaml`, "utf8"));
    return langSchema;
}

//const langNames = fs.readdirSync("langs").map(x => x.replace(".yaml", ""));
const langNames = ["cpp", "csharp", "go", "java", "javascript", "perl", "php", "python"];
for (const langName of langNames) {
    const lang = loadLangSchema(langName);
    new CaseConverter(lang.casing).process(schemaCtx.schema);
    saveSchemaState(schemaCtx, `${prgName}_3_${langName}_CasingConverted`);
    
    const codeGen = new CodeGenerator(schema, lang);
    const generatedCode = codeGen.generate(true);
    Utils.writeFile(`tmp/${prgName}.${lang.extension}`, generatedCode);
    Utils.writeFile(`tmp/TemplateGenerators_${langName}.js`, codeGen.templateObjectCode);
}
