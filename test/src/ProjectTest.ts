import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFile, glob, readDir, baseDir, getLangFiles } from "./TestUtils";
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';
import * as LangFileSchema from '@one/Generator/LangFileSchema';
import * as YAML from "js-yaml";
import { TSOverviewGenerator } from '@one/One/TSOverviewGenerator';
import { SourceFile, SourcePath, Package, Workspace } from '@one/One/Ast/Types';
import { ResolveImports } from "@one/One/Transforms/ResolveImports";
import { FillAttributesFromTrivia } from "@one/One/Transforms/FillAttributesFromTrivia";
import { ResolveGenericIdentifiers } from "@one/One/Transforms/ResolveGenericIdentifiers";
import { FillParent } from "@one/One/Transforms/FillParent";
import { writeFile } from 'fs';
import { _ } from '@one/Utils/Underscore';
import { PackageStateCapture } from './DiffUtils';
import * as color from "ansi-colors";

const pacMan = new PackageManager(new PackagesFolderSource(`${baseDir}/packages`));
const langs = getLangFiles();

//const compiler = new OneCompiler();
async function initCompiler() {
    await pacMan.loadAllCached();

    // const overlayCode = await readFile(`langs/NativeResolvers/typescript.ts`);
    // const stdlibCode = pacMan.getInterfaceDefinitions();
    // const genericTransforms = await readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

    // compiler.setupWithSource(overlayCode, stdlibCode, genericTransforms);

    // for (const lang of langs)
    //     OneCompiler.setupLangSchema(lang, pacMan, compiler.stdlibCtx.schema);
}

function createWorkspace() {
    const ws = new Workspace();
    for (const intfPkg of pacMan.intefacesPkgs) {
        const libName = `${intfPkg.interfaceYaml.vendor}.${intfPkg.interfaceYaml.name}-v${intfPkg.interfaceYaml.version}`;
        const libPkg = new Package(libName);
        const file = TypeScriptParser2.parseFile(intfPkg.definition, new SourcePath(libPkg, Package.INDEX));
        libPkg.addFile(file);
        ws.addPackage(libPkg);
    }
    return ws;
}

function head(text: string) { 
    const x = "~".repeat(text.length+4);
    console.log(color.bgRed(` ~~~~~~~~${x}~~~~~~~~ \n ~~~~~~~~  ${text}  ~~~~~~~~ \n ~~~~~~~~${x}~~~~~~~~ `));
}

initCompiler().then(() => {
    const testsDir = "test/testSuites/ProjectTest";
    for (const projName of readDir(testsDir)) {
        const workspace = createWorkspace();
        const projectPkg = new Package("@");
        workspace.addPackage(projectPkg);

        const projDir = `${testsDir}/${projName}/src`;
        for (const file of glob(projDir))
            projectPkg.addFile(TypeScriptParser2.parseFile(readFile(`${projDir}/${file}`), new SourcePath(projectPkg, file)));

        const saveState = () => new PackageStateCapture(projectPkg);
        const s0 = saveState();

        for (const file of Object.values(projectPkg.files)) {
            FillParent.processFile(file);
            FillAttributesFromTrivia.processFile(file);
        }

        const s1 = saveState();
        ResolveImports.processWorkspace(workspace);

        const s2 = saveState();
        for (const file of Object.values(projectPkg.files))
            new ResolveGenericIdentifiers().visitSourceFile(file);
        const s3 = saveState();

        head("SUMMARY");
        s3.diff(s2).printChangedFiles("summary");

        head("FULL");
        s3.diff(s0).printChangedFiles("full");

        debugger;

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
