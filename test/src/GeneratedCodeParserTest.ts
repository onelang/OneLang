import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { CSharpParser } from "@one/Parsers/CSharpParser";
import { readFile, writeFile } from "./TestUtils";
import { OneAst as ast } from "@one/One/Ast";
import { AstHelper } from "@one/One/AstHelper";
import { OneCompiler } from "@one/OneCompiler";
import { RubyParser } from "@one/Parsers/RubyParser";
import { PhpParser } from "@one/Parsers/PhpParser";
import * as fs from 'fs';
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from "@one/StdLib/PackagesFolderSource";

(async () => {

const prgExcludeList = ["stdlib", "overlay", "TemplateTests", "LICENSE"];
let prgNames = (<string[]>fs.readdirSync("test/artifacts")).filter(x => !x.startsWith("."));

prgNames = prgNames.filter(x => !prgExcludeList.includes(x));

const pacMan = new PackageManager(new PackagesFolderSource());
await pacMan.loadAllCached();
const stdlibCode = pacMan.getInterfaceDefinitions();

const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

const langs: { [langName: string]: { ext: string, parse: (src: string) => ast.Schema } } = {    
    typescript: { ext: "ts", parse: src => TypeScriptParser2.parseFile(src) },
    csharp: { ext: "cs", parse: src => CSharpParser.parseFile(src) },
    ruby: { ext: "rb", parse: src => RubyParser.parseFile(src) },
    php: { ext: "php", parse: src => PhpParser.parseFile(src) },
};

let langsToTest = Object.keys(langs);
langsToTest = ["csharp"];
const skipTests = { "php": ["JsonParseTest", "ReflectionTest"] };

//prgExcludeList = [...prgExcludeList, "OneLang2", "StrReplaceTest"]

for (const langName of langsToTest) {
    const langData = langs[langName];
    const overlayCode = readFile(`langs/NativeResolvers/${langName}.ts`);

    for (const prgName of prgNames) {
        if ((skipTests[langName] || []).includes(prgName)) continue;
        const outDir = `test/artifacts/${prgName}`;

        const fn = `${outDir}/results/${prgName}.${langData.ext}`;
        console.log(`Parsing '${fn}'...`);
        let content = readFile(fn);
        
        const schema = langData.parse(content);
        writeFile(`${outDir}/regen/0_Original_${langData.ext}.json`, AstHelper.toJson(schema));

        const compiler = new OneCompiler();
        compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, generator: () => string) => {
            if (schemaType !== "program") return;
            writeFile(`${outDir}/regen/schemaStates_${langName}/${name}.txt`, generator());
        };
        compiler.setup(overlayCode, stdlibCode, genericTransforms);
        compiler.parse(langName, content);
    }
}

})();
