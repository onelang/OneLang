require("./Utils/Extensions.js");
import { writeFile, readFile, jsonRequest, timeNow } from "./Utils/NodeUtils";
import { OneCompiler } from "./OneCompiler";
import { langConfigs, LangConfig, CompileResult } from "./Generator/LangConfigs";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { deindent } from "./Generator/Utils";
import { TypeScriptParser2 } from "./Parsers/TypeScriptParser2";
import { PackagesFolderSource, PackageManager } from "./StdLib/PackageManager";
const fs = require("fs");
global["YAML"] = require('yamljs'); 
declare var YAML;

global["debugOn"] = false;

const pacMan = new PackageManager(new PackagesFolderSource());
pacMan.loadAllCached().then(() => main());

function main() {
    const stdlibCode = pacMan.getInterfaceDefinitions();
    
    let prgNames = ["ReflectionTest"];
    const runPrg = true;
    const langFilter = "php";
    const compileAll = prgNames[0] === "all";
    
    if (compileAll)
        prgNames = fs.readdirSync("input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));
    
    const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
    const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
    
    const compiler = new OneCompiler();
    compiler.setup(overlayCode, stdlibCode, genericTransforms);
    
    const langConfigVals = Object.values(langConfigs);
    for (const langConfig of langConfigVals) {
        const langYaml = readFile(`langs/${langConfig.name}.yaml`);
        langConfig.schema = OneCompiler.parseLangSchema(langYaml, pacMan, compiler.stdlibCtx.schema);
    }
    
    for (const prgName of prgNames) {
        console.log(`converting program '${prgName}'...`);
        compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => {
            writeFile(`generated/${schemaType === "program" ? prgName : schemaType}/schemaStates/${name}.${type === "overviewText" ? "txt" : "json"}`, data); 
        };
    
        const programCode = readFile(`input/${prgName}.ts`).replace(/\r\n/g, '\n');
        let t0 = timeNow();
        compiler.parse("typescript", programCode);
        const parseTime = timeNow() - t0;
        
        const compileTimes = [];
        for (const lang of langConfigVals) {
            if (langFilter && lang.name !== langFilter) continue;
        
            //console.log(`converting program '${prgName}' to ${lang.name}...`);
            const ts = [];
            //try {
                t0 = timeNow();
                const codeGen = compiler.getCodeGenerator(lang.schema);
                lang.request.code = codeGen.generate(true);
                lang.request.packageSources = pacMan.getLangNativeImpls(lang.name);
                compileTimes.push(timeNow() - t0);
                writeFile(`generated/${prgName}/results/${prgName}.${codeGen.lang.extension}`, codeGen.generatedCode);
            //} catch(e) {
            //    console.error(e);
            //}
        }
    
        console.log(`parse time: ${parseTime}ms, compile time: ${compileTimes.reduce((x, y) => x + y, 0)}ms (${compileTimes.join("+")})`);
        
        // run compiled codes
        async function executeCodes() {
            console.log(" === START === ");
            var promises = langConfigVals.map(async lang => {
                if (langFilter && lang.name !== langFilter) return true;
        
                console.log(`========= CODE =========\n${lang.request.code}\n========= RESULT =========`);
                const result = await jsonRequest<CompileResult>(`http://127.0.0.1:11111/compile`, lang.request);
                console.log(`${lang.name}:\n\n    ${(result.result||result.exceptionText||"?").replace(/\n/g, "\n    ")}`);
                return true;
            });
            const results = await Promise.all(promises);
            console.log(" === DONE === ");
        }
        
        if (runPrg && !compileAll)
            executeCodes();
    }
}
