import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFile, glob, readDir, baseDir, getLangFiles } from "./TestUtils";
import { OneAst } from '@one/One/Ast';
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';
import { OneCompiler } from '@one/OneCompiler';
import { LangFileSchema } from '@one/Generator/LangFileSchema';
import * as YAML from "js-yaml";
import { SchemaContext } from '@one/One/SchemaContext';

const langs = getLangFiles();

const compiler = new OneCompiler();
async function initCompiler() {
    const pacMan = new PackageManager(new PackagesFolderSource(`${baseDir}/packages`));
    await pacMan.loadAllCached();

    const overlayCode = await readFile(`langs/NativeResolvers/typescript.ts`);
    const stdlibCode = pacMan.getInterfaceDefinitions();
    const genericTransforms = await readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

    compiler.setupWithSource(overlayCode, stdlibCode, genericTransforms);

    for (const lang of langs)
        OneCompiler.setupLangSchema(lang, pacMan, compiler.stdlibCtx.schema);
}

initCompiler().then(() => {
    const testsDir = "test/testSuites/ProjectTest";
    for (const projName of readDir(testsDir)) {
        const projDir = `${testsDir}/${projName}/src`;
        const projFiles = glob(projDir);
        
        const projSchemas: { [path: string]: SchemaContext } = {};
        for (const file of projFiles) {
            const schema = projSchemas[file] = OneCompiler.parseSchema("typescript", readFile(`${projDir}/${file}`));
            schema.fileName = file;
        }

        const outFiles: { [path: string]: string } = {};
        for (const file of projFiles) {
            const schema = projSchemas[file];
            for (const s of Object.values(projSchemas).filter(x => x !== schema))
                schema.addDependencySchema(s);
            compiler.schemaCtx = schema;
            compiler.processSchema();

            const codeGen = compiler.getCodeGenerator(langs.find(x => x.name === "csharp"));
            const generatedCode = codeGen.generate(false);
            outFiles[file] = generatedCode;
        }
    }
})
