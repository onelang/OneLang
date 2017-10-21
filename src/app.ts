require("./Utils/Extensions.js");
global["YAML"] = require('yamljs'); 
const fs = require("fs");
import { writeFile, readFile, jsonRequest } from "./Utils/NodeUtils";
import { OneCompiler } from "./OneCompiler";
import { langConfigs, LangConfig, CompileResult } from "./Generator/LangConfigs";

declare var YAML;

const prgName = "FakeEnumTest";
const runPrg = true;
const langFilter = "";

global["debugOn"] = false;

const compiler = new OneCompiler();
compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => {
    writeFile(`tmp/${schemaType === "program" ? prgName : schemaType}/schemaStates/${name}.${type === "overviewText" ? "txt" : "json"}`, data); 
};

const programCode = readFile(`input/${prgName}.ts`);
const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
compiler.parseFromTS(programCode, overlayCode, stdlibCode, genericTransforms);

const langs = Object.values(langConfigs);
for (const lang of langs) {
    if (langFilter && lang.name !== langFilter) continue;

    const langYaml = readFile(`langs/${lang.name}.yaml`);
    const codeGen = compiler.getCodeGenerator(langYaml, lang.name);
    lang.request.code = codeGen.generate(true);

    writeFile(`tmp/${prgName}/results/${prgName}.${codeGen.lang.extension}`, codeGen.generatedCode);
    writeFile(`tmp/TemplateGenerators_${lang.name}.js`, codeGen.templateObjectCode);
}

// run compiled codes
async function executeCodes() {
    console.log(" === START === ");
    var promises = langs.map(async lang => {
        if (langFilter && lang.name !== langFilter) return true;

        const result = await jsonRequest<CompileResult>(`http://127.0.0.1:${lang.port}/compile`, lang.request);
        console.log(`${lang.name}: ${JSON.stringify(result.result||result.exceptionText||"?")}`);
        return true;
    });
    const results = await Promise.all(promises);
    console.log(" === DONE === ", results.every(x => x));
}

if (runPrg)
    executeCodes();
