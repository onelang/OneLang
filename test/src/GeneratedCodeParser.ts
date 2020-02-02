import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { CSharpParser } from "@one/Parsers/CSharpParser";
import { readFile, writeFile } from "@one/Utils/NodeUtils";
import { OneAst as ast } from "@one/One/Ast";
import { AstHelper } from "@one/One/AstHelper";
import { OneCompiler } from "@one/OneCompiler";
import { RubyParser } from "@one/Parsers/RubyParser";
import { PhpParser } from "@one/Parsers/PhpParser";
require("../Utils/Extensions.js");
const fs = require("fs");
global["YAML"] = require('yamljs'); 
declare var YAML;

let prgNames = (<string[]>fs.readdirSync("generated")).filter(x => !x.startsWith("."));
let prgExcludeList = ["stdlib", "overlay", "TemplateTests", "LICENSE"];

prgNames = prgNames.filter(x => !prgExcludeList.includes(x));

const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

const langs: { [langName: string]: { ext: string, parse: (src: string) => ast.Schema } } = {    
    typescript: { ext: "ts", parse: src => TypeScriptParser2.parseFile(src) },
    csharp: { ext: "cs", parse: src => CSharpParser.parseFile(src) },
    ruby: { ext: "rb", parse: src => RubyParser.parseFile(src) },
    php: { ext: "php", parse: src => PhpParser.parseFile(src) },
};

let langsToTest = Object.keys(langs);
langsToTest = ["php"];
const skipTests = { "php": ["JsonParseTest"] };

//prgExcludeList = [...prgExcludeList, "OneLang2", "StrReplaceTest"]

for (const langName of langsToTest) {
    const langData = langs[langName];
    const overlayCode = readFile(`langs/NativeResolvers/${langName}.ts`);

    for (const prgName of prgNames) {
        if (skipTests[langName].includes(prgName)) continue;

        const fn = `generated/${prgName}/results/${prgName}.${langData.ext}`;
        console.log(`Parsing '${fn}'...`);
        let content = readFile(fn);
        
        const schema = langData.parse(content);
        writeFile(`generated/${prgName}/regen/0_Original_${langData.ext}.json`, AstHelper.toJson(schema));

        const compiler = new OneCompiler();
        compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => {
            if (schemaType !== "program") return;
            writeFile(`generated/${prgName}/regen/schemaStates_${langName}/${name}.${type === "overviewText" ? "txt" : "json"}`, data);
        };
        compiler.setup(overlayCode, stdlibCode, genericTransforms);
        compiler.parse(langName, content);
    }
}
