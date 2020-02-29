import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFile, glob, readDir, baseDir, getLangFiles } from "./TestUtils";
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';
import { SourcePath, Package, Workspace, SourceFile, ExportScopeRef } from '@one/One/Ast/Types';
import { ResolveImports } from "@one/One/Transforms/ResolveImports";
import { FillAttributesFromTrivia } from "@one/One/Transforms/FillAttributesFromTrivia";
import { ResolveGenericTypeIdentifiers } from "@one/One/Transforms/ResolveGenericTypeIdentifiers";
import { FillParent } from "@one/One/Transforms/FillParent";
import { Linq } from '@one/Utils/Underscore';
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

// AST TODO:
//  * Class / Method references should not have specialized generic types (so it should only store "List" and not "List<string>")
//  * Class specialization happens via NewExpression which gives back a specialized INSTANCE
//  * NewExpression can only specialize Classes, no Enums or Interfaces, etc
//  * NewExpression should not contain typeArguments, only a UnresolvedType which itself can have typeArguments
//  * ClassType should have typeArguments (somewhere we should store e.g. an instance is specialized)
//  * (???) Method generics type should be stored in CallExpression as basically they are specialized before the call
//    * And this way a language Parser can store method type generics somewhere: here `.method<string>()` method is a property accessor,
//    *   that should not have typeArguments, but the call itself can have!

initCompiler().then(() => {
    const nativeResolver = TypeScriptParser2.parseFile(readFile(`langs/NativeResolvers/typescript.ts`));
    //nativeResolver.classes.map(cls => new ClassType(cls))

    const testsDir = "test/testSuites/ProjectTest";
    const tests = readDir(testsDir).map(projName => ({ projName, projDir: `${testsDir}/${projName}/src` }));
    tests.push({ projName: "OneLang", projDir: `src` });

    for (const test of tests) {
        if (test.projName !== "OneLang") continue;
        //if (test.projName !== "ComplexTest01") continue;

        const workspace = createWorkspace();
        const projectPkg = new Package("@");
        workspace.addPackage(projectPkg);

        workspace.addPackage(new Package("js-yaml", [new SourceFile([], {}, {}, {}, null, new SourcePath(null, "index"), new ExportScopeRef("js-yaml", "index"))]));

        const files = glob(test.projDir);
        for (const file of files)
            projectPkg.addFile(TypeScriptParser2.parseFile(readFile(`${test.projDir}/${file}`), new SourcePath(projectPkg, file)));

        const pkgStates: PackageStateCapture[] = [];
        const saveState = () => pkgStates.push(new PackageStateCapture(projectPkg));
        saveState();

        for (const file of Object.values(projectPkg.files)) {
            FillParent.processFile(file);
            FillAttributesFromTrivia.processFile(file);
        }

        saveState();
        ResolveImports.processWorkspace(workspace);

        //saveState();
        //for (const file of Object.values(projectPkg.files))
        //    new ResolveGenericTypeIdentifiers().visitSourceFile(file);

        //saveState();
        //for (const file of Object.values(projectPkg.files))
        //    new ResolveUnresolvedTypes().visitSourceFile(file);

        saveState();
        //head("SUMMARY");
        //_(pkgStates).last().diff(pkgStates[pkgStates.length - 2]).printChangedFiles("summary");
        head("FULL");
        new Linq(pkgStates).last().diff(pkgStates[0]).printChangedFiles("full");

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
