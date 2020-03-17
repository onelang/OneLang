import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFile, glob, readDir, baseDir, getLangFiles, writeFile } from "./TestUtils";
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';
import { SourcePath, Package, Workspace, SourceFile, ExportScopeRef, LiteralTypes, Class } from '@one/One/Ast/Types';
import { ResolveImports } from "@one/One/Transforms/ResolveImports";
import { FillAttributesFromTrivia } from "@one/One/Transforms/FillAttributesFromTrivia";
import { ResolveGenericTypeIdentifiers } from "@one/One/Transforms/ResolveGenericTypeIdentifiers";
import { ResolveUnresolvedTypes } from "@one/One/Transforms/ResolveUnresolvedTypes";
import { ResolveIdentifiers } from "@one/One/Transforms/ResolveIdentifiers";
import { InstanceOfImplicitCast } from "@one/One/Transforms/InstanceOfImplicitCast";
import { ConvertToMethodCall } from "@one/One/Transforms/ConvertToMethodCall";
import { InferTypes } from "@one/One/Transforms/InferTypes";
import { FillParent } from "@one/One/Transforms/FillParent";
import { Linq } from '@one/Utils/Underscore';
import { PackageStateCapture } from './DiffUtils';
import * as color from "ansi-colors";
import { ClassType } from '@one/One/Ast/AstTypes';

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
    const nativeFile = TypeScriptParser2.parseFile(readFile(`langs/NativeResolvers/typescript.ts`));
    const nativeExports = Package.collectExportsFromFile(nativeFile, true);
    new FillParent().visitSourceFile(nativeFile);
    FillAttributesFromTrivia.processFile(nativeFile);
    new ResolveGenericTypeIdentifiers().visitSourceFile(nativeFile);
    new ResolveUnresolvedTypes().visitSourceFile(nativeFile);

    const testsDir = "test/testSuites/ProjectTest";
    const tests = readDir(testsDir).map(projName => ({ projName, projDir: `${testsDir}/${projName}/src` }));
    tests.push({ projName: "OneLang", projDir: `src` });

    for (const test of tests) {
        if (test.projName !== "OneLang") continue;
        //if (test.projName !== "ComplexTest01") continue;

        const workspace = createWorkspace();
        const projectPkg = new Package("@");
        workspace.addPackage(projectPkg);

        const jsYamlPkg = new Package("js-yaml");
        jsYamlPkg.addFile(new SourceFile([], new Map(), new Map(), new Map(), new Map(), null, new SourcePath(jsYamlPkg, "index"), new ExportScopeRef("js-yaml", "index")));
        workspace.addPackage(jsYamlPkg);

        const files = glob(test.projDir);
        for (const fn of files) {
            const file = TypeScriptParser2.parseFile(readFile(`${test.projDir}/${fn}`), new SourcePath(projectPkg, fn));
            file.addAvailableSymbols(nativeExports.getAllExports());
            file.literalTypes = new LiteralTypes(
                new ClassType(<Class>file.availableSymbols.get("TsBoolean")),
                new ClassType(<Class>file.availableSymbols.get("TsNumber")),
                new ClassType(<Class>file.availableSymbols.get("TsString")),
                new ClassType(<Class>file.availableSymbols.get("RegExp")),
                new ClassType(<Class>file.availableSymbols.get("TsArray")),
                new ClassType(<Class>file.availableSymbols.get("TsMap")));
            projectPkg.addFile(file);
        }

        const pkgStates: PackageStateCapture[] = [];
        const saveState = () => { 
            const state = new PackageStateCapture(projectPkg);
            pkgStates.push(state);
            return state;
        }

        const printState = () => {
            console.log(pkgStates[pkgStates.length - 1].diff(pkgStates[pkgStates.length - 2]).getChanges("summary"));
            writeFile(`test/artifacts/ProjectTest/${test.projName}/lastState.txt`, pkgStates[pkgStates.length - 1].getSummary());
        }

        saveState();

        new FillParent().visitPackage(projectPkg);
        FillAttributesFromTrivia.processPackage(projectPkg);
        saveState();

        ResolveImports.processWorkspace(workspace);
        saveState();

        new ResolveGenericTypeIdentifiers().visitPackage(projectPkg);
        saveState();

        new ConvertToMethodCall().visitPackage(projectPkg);
        saveState();

        new ResolveUnresolvedTypes(workspace.errorManager).visitPackage(projectPkg);
        saveState();

        new ResolveIdentifiers(workspace.errorManager).visitPackage(projectPkg);
        saveState();

        new InstanceOfImplicitCast(workspace.errorManager).visitPackage(projectPkg);
        saveState();

        printState();

        try {
            new InferTypes(workspace.errorManager).visitPackage(projectPkg);
        } catch (e) {
            if (e instanceof Error)
                workspace.errorManager.throw(e.message);
            else
                debugger;
        }
        saveState();

        const lastState = new Linq(pkgStates).last();
        if (workspace.errorManager.errors.length > 0)
            debugger;

        //head("SUMMARY");
        //_(pkgStates).last().diff(pkgStates[pkgStates.length - 2]).printChangedFiles("summary");
        head("FULL");
        const allChanges = lastState.diff(pkgStates[0]).getChanges("full");
        console.log(allChanges);

        //writeFile(`test/artifacts/ProjectTest/${test.projName}/allChanges.txt`, allChanges);
        //writeFile(`test/artifacts/ProjectTest/${test.projName}/lastState.txt`, pkgStates[pkgStates.length - 1].getSummary());

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
