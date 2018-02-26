require("./Utils/Extensions.js");
import { writeFile, readFile, jsonRequest, timeNow } from "./Utils/NodeUtils";
import { OneCompiler } from "./OneCompiler";
import { langConfigs, LangConfig, CompileResult } from "./Generator/LangConfigs";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { deindent } from "./Generator/Utils";
const fs = require("fs");
global["YAML"] = require('yamljs'); 
declare var YAML;

global["debugOn"] = false;

let prgNames = ["all"];
const runPrg = false;
const langFilter = "";
const compileAll = prgNames[0] === "all";

if (compileAll)
    prgNames = fs.readdirSync("input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));

const langConfigVals = Object.values(langConfigs);
for (const langConfig of langConfigVals) {
    const langYaml = readFile(`langs/${langConfig.name}.yaml`);
    langConfig.schema = OneCompiler.parseLangSchema(langYaml);
}

for (const prgName of prgNames) {
    const compiler = new OneCompiler();
    compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => {
        writeFile(`generated/${schemaType === "program" ? prgName : schemaType}/schemaStates/${name}.${type === "overviewText" ? "txt" : "json"}`, data); 
    };
    
    const programCode = readFile(`input/${prgName}.ts`).replace(/\r\n/g, '\n');
    const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
    const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
    const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
    compiler.parse("typescript", programCode, overlayCode, stdlibCode, genericTransforms);
    
    for (const lang of langConfigVals) {
        if (langFilter && lang.name !== langFilter) continue;
    
        console.log(`converting program '${prgName}' to ${lang.name}...`);
        const ts = [];
        //try {
            ts.push(timeNow());
            const codeGen = compiler.getCodeGenerator(lang.schema);
            ts.push(timeNow());
            lang.request.code = codeGen.generate(true);
            ts.push(timeNow());
            writeFile(`generated/${prgName}/results/${prgName}.${codeGen.lang.extension}`, codeGen.generatedCode);
            ts.push(timeNow());
            console.log("time", ts.map((x,i) => i === 0 ? undefined : x - ts[i - 1]).join(", "));
        //} catch(e) {
        //    console.error(e);
        //}
    }
    
    // run compiled codes
    async function executeCodes() {
        console.log(" === START === ");
        var promises = langConfigVals.map(async lang => {
            if (langFilter && lang.name !== langFilter) return true;
    
            const result = await jsonRequest<CompileResult>(`http://127.0.0.1:8000/compile`, lang.request);
            console.log(`${lang.name}: ${JSON.stringify(result.result||result.exceptionText||"?")}`);
            return true;
        });
        const results = await Promise.all(promises);
        console.log(" === DONE === ", results.every(x => x));
    }
    
    if (runPrg && !compileAll)
        executeCodes();
}

