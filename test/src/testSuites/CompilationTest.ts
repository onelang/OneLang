import 'module-alias/register';
import * as fs from 'fs';
import { readFile, timeNow, glob, readDir } from "../TestUtils";
import { ArtifactManager, LocalFileSystem } from "../ArtifactManager";
import { OneCompiler } from "@one/OneCompiler";
import { langConfigs } from "@one/Generator/LangConfigs";
import { PackageManager } from "@one/StdLib/PackageManager";
import { PackagesFolderSource } from "@one/StdLib/PackagesFolderSource";
import { FolderCacheBundle } from '../FolderCacheBundle';

const compiler = new OneCompiler();
const artifactMan = new ArtifactManager(new FolderCacheBundle("test/artifacts/CompilationTest", null));
//const artifactMan = new ArtifactManager(new LocalFileSystem("test/artifacts/CompilationTest"));

async function initCompiler() {
    const pacMan = new PackageManager(new PackagesFolderSource(`${__dirname}/../../../packages`));
    await pacMan.loadAllCached();

    const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
    const stdlibCode = pacMan.getInterfaceDefinitions();
    const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
    
    compiler.setup(overlayCode, stdlibCode, genericTransforms);
    
    for (const langConfig of Object.values(langConfigs)) {
        const langYaml = readFile(`langs/${langConfig.name}.yaml`);
        langConfig.schema = OneCompiler.parseLangSchema(langYaml, pacMan, compiler.stdlibCtx.schema);
    }
}

const testBaseDir = `test/testSuites/CompilationTest`;
const prgNames = readDir(testBaseDir).filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));
const prgCodes: { [name: string]: string } = {};

// load / prepare everything, so only parse + compilation time matters in tests
before(async () => {
    await initCompiler();
    artifactMan.fs.init();
    for (const prgName of prgNames)
        prgCodes[prgName] = readFile(`${testBaseDir}/${prgName}.ts`).replace(/\r\n/g, '\n');
});

after(() => {
    artifactMan.fs.destroy();
});

for (const prgName of prgNames) {
    it(prgName, () => {
        artifactMan.delayThrows();

        compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, generator: () => string) => {
            if (type !== "overviewText") return;
            if (schemaType !== "program") throw new Error(`Expected schemaType "program", but got "${schemaType}"`);
            if (name.includes("_Init")) return;
            artifactMan.throwIfModified(`${prgName}/schemaStates/${name}.txt`, generator()); 
        };
    
        compiler.parse("typescript", prgCodes[prgName]);
        
        for (const lang of Object.values(langConfigs)) {
            const codeGen = compiler.getCodeGenerator(lang.schema);
            const generatedCode = codeGen.generate(true);
            artifactMan.throwIfModified(`${prgName}/results/${prgName}.${codeGen.lang.extension}`, generatedCode);
        }

        artifactMan.throwFirstDelayed();
    });
}

//after(() => console.log("checkArtifact", "time=", checkArtifactTime, "fileCount=", fileCount));

// // run compiled codes
// async function executeCodes() {
//     console.log(" === START === ");
//     var promises = langConfigVals.map(async lang => {
//         if (langFilter && lang.name !== langFilter) return true;

//         console.log(`========= CODE =========\n${lang.request.code}\n========= RESULT =========`);
//         const result = await jsonRequest<CompileResult>(`http://127.0.0.1:11111/compile`, lang.request);
//         console.log(`${lang.name}:\n\n    ${(result.result||result.exceptionText||"?").replace(/\n/g, "\n    ")}`);
//         return true;
//     });
//     const results = await Promise.all(promises);
//     console.log(" === DONE === ");
// }
