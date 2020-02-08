import 'module-alias/register';
import * as fs from 'fs';
import { writeFile, readFile, jsonRequest, timeNow } from "@one/Utils/NodeUtils";
import { OneCompiler } from "@one/OneCompiler";
import { langConfigs, CompileResult } from "@one/Generator/LangConfigs";
import { PackageManager } from "@one/StdLib/PackageManager";
import { PackagesFolderSource } from "@one/StdLib/PackagesFolderSource";

const pacMan = new PackageManager(new PackagesFolderSource());
pacMan.loadAllCached().then(() => main());

function main() {
    const stdlibCode = pacMan.getInterfaceDefinitions();
    
    let prgNames = ["all"];
    const runPrg = false;
    const langFilter = false;
    const compileAll = prgNames[0] === "all";
    
    if (compileAll)
        prgNames = fs.readdirSync("test/input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));
    
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
            writeFile(`test/artifacts/${schemaType === "program" ? prgName : schemaType}/schemaStates/${name}.${type === "overviewText" ? "txt" : "json"}`, data); 
        };
    
        const programCode = readFile(`test/input/${prgName}.ts`).replace(/\r\n/g, '\n');
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
                writeFile(`test/artifacts/${prgName}/results/${prgName}.${codeGen.lang.extension}`, codeGen.generatedCode);
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
