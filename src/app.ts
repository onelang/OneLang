require("./Utils/Extensions.js");
global["YAML"] = require('yamljs'); 
const fs = require("fs");
import { writeFile, readFile, jsonRequest } from "./Utils/NodeUtils";
import { OneCompiler } from "./OneCompiler";
import { langConfigs, LangConfig, CompileResult } from "./Generator/LangConfigs";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { deindent } from "./Generator/Utils";

declare var YAML;

global["debugOn"] = false;

let prgNames = ["all"];
const runPrg = false;
const langFilter = "";
const compileAll = prgNames[0] === "all";

if (compileAll)
    prgNames = fs.readdirSync("input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));

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
    
    //const csharpLang = <LangFileSchema.LangFile> YAML.parse(readFile(`langs/csharp.yaml`));
    //const template = new Template(csharpLang.expressions["templateString"]);
    //const compiled = template.templateToJS(template.treeRoot, ["testValue"]);
    
    const langs = Object.values(langConfigs);
    for (const lang of langs) {
        if (langFilter && lang.name !== langFilter) continue;
    
        console.log(`converting program '${prgName}' to ${lang.name}...`);
        //try {
            const langYaml = readFile(`langs/${lang.name}.yaml`);
            const codeGen = compiler.getCodeGenerator(langYaml, lang.name);
            lang.request.code = codeGen.generate(true);
        
            writeFile(`generated/${prgName}/results/${prgName}.${codeGen.lang.extension}`, codeGen.generatedCode);
        //} catch(e) {
        //    console.error(e);
        //}
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
    
    if (runPrg && !compileAll)
        executeCodes();
}

