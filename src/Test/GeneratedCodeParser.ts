import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";
import { CSharpParser } from "../Parsers/CSharpParser";
import { readFile, writeFile } from "../Utils/NodeUtils";
import { OneAst as ast } from "../One/Ast";
import { AstHelper } from "../One/AstHelper";
import { OneCompiler } from "../OneCompiler";
import { RubyParser } from "../Parsers/RubyParser";
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
};

let langsToTest = Object.keys(langs);
langsToTest = ["ruby"];

//prgExcludeList = [...prgExcludeList, "OneLang2", "StrReplaceTest"]

for (const langName of langsToTest) {
    const langData = langs[langName];
    const overlayCode = readFile(`langs/NativeResolvers/${langName}.ts`);

    for (const prgName of prgNames) {
        const fn = `generated/${prgName}/results/${prgName}.${langData.ext}`;
        console.log(`Parsing '${fn}'...`);
        let content = readFile(fn);
        
        const schema = langData.parse(content);
        writeFile(`generated/${prgName}/regen/0_Original_${langData.ext}.json`, AstHelper.toJson(schema));

        const compiler = new OneCompiler();
        compiler.parse(langName, content, overlayCode, stdlibCode, genericTransforms);
    }
}
