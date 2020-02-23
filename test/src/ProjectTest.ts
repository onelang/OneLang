import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFile, glob, readDir, baseDir, getLangFiles } from "./TestUtils";
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';
import * as LangFileSchema from '@one/Generator/LangFileSchema';
import * as YAML from "js-yaml";
import { TSOverviewGenerator } from '@one/One/TSOverviewGenerator';
import { SourceFile, SourcePath, Package } from '@one/One/Ast/Types';
import { FillAttributesFromTrivia } from "@one/One/Transforms/FillAttributesFromTrivia";
import { FillParent } from "@one/One/Transforms/FillParent";

const langs = getLangFiles();

//const compiler = new OneCompiler();
async function initCompiler() {
    // const pacMan = new PackageManager(new PackagesFolderSource(`${baseDir}/packages`));
    // await pacMan.loadAllCached();

    // const overlayCode = await readFile(`langs/NativeResolvers/typescript.ts`);
    // const stdlibCode = pacMan.getInterfaceDefinitions();
    // const genericTransforms = await readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

    // compiler.setupWithSource(overlayCode, stdlibCode, genericTransforms);

    // for (const lang of langs)
    //     OneCompiler.setupLangSchema(lang, pacMan, compiler.stdlibCtx.schema);
}

initCompiler().then(() => {
    const testsDir = "test/testSuites/ProjectTest";
    for (const projName of readDir(testsDir)) {
        const projDir = `${testsDir}/${projName}/src`;
        const projFiles = glob(projDir);
        
        const projectPkg = new Package("@");
        const projSchemas: { [path: string]: SourceFile } = {};
        for (const file of projFiles) {
            const schema = projSchemas[file] = TypeScriptParser2.parseFile(readFile(`${projDir}/${file}`), new SourcePath(projectPkg, file));
            FillParent.processFile(schema);
            FillAttributesFromTrivia.processFile(schema);
            //schemaCtx.fileName = file;
            const tsOverview = new TSOverviewGenerator().generate(schema);
            console.log(`=== ${file} ===\n${tsOverview}`);
        }

        continue;

        // const outFiles: { [path: string]: string } = {};
        // for (const file of projFiles) {
        //     const schema = projSchemas[file];
        //     for (const s of Object.values(projSchemas).filter(x => x !== schema))
        //         schema.addDependencySchema(s);
        //     compiler.schemaCtx = schema;
        //     compiler.processSchema();

        //     const codeGen = compiler.getCodeGenerator(langs.find(x => x.name === "csharp"));
        //     const generatedCode = codeGen.generate(false);
        //     outFiles[file] = generatedCode;
        // }
    }
})
