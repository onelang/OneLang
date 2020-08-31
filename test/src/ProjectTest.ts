import 'module-alias/register';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { readFile, glob, readDir, baseDir, writeFile, exists } from "./TestUtils";
import { CsharpGenerator } from "@one/Generator/CsharpGenerator";
import { PythonGenerator } from "@one/Generator/PythonGenerator";
import { Compiler } from "@one/One/Compiler";
import { PackageStateCapture } from "@one/Test/PackageStateCapture";
import * as color from "ansi-colors";

const compiler = new Compiler();

function head(text: string) { 
    const x = "~".repeat(text.length+4);
    console.log(color.bgRed(` ~~~~~~~~${x}~~~~~~~~ \n ~~~~~~~~  ${text}  ~~~~~~~~ \n ~~~~~~~~${x}~~~~~~~~ `));
}

compiler.init(`${baseDir}/packages`).then(() => {
    compiler.setupNativeResolver(readFile(`langs/NativeResolvers/typescript.ts`));

    const testsDir = "test/testSuites/ProjectTest";
    const tests = readDir(testsDir).map(projName => ({ projName, projDir: `${testsDir}/${projName}/src` }));
    tests.push({ projName: "OneLang", projDir: `src` });

    for (const test of tests) {
        if (test.projName !== "OneLang") continue;
        //if (test.projName !== "ComplexTest01") continue;

        compiler.newWorkspace(test.projName);

        const files = glob(test.projDir);
        for (const fn of files)
            compiler.addProjectFile(fn, readFile(`${test.projDir}/${fn}`));

        const pkgStates: PackageStateCapture[] = [];
        const saveState = () => { 
            const state = new PackageStateCapture(compiler.projectPkg);
            pkgStates.push(state);
            return state;
        }

        //const printState = () => console.log(pkgStates[pkgStates.length - 1].diff(pkgStates[pkgStates.length - 2]).getChanges("summary"));

        let stage = 0;
        compiler.hooks = {
            afterStage: stageName => {
                const state = saveState();
                const stageFn = `test/artifacts/ProjectTest/${test.projName}/stages/${stage++}_${stageName}.txt`;
                const stageSummary = state.getSummary();
                //if (exists(stageFn)) {
                //    const expectedState =
                //}
                writeFile(stageFn, stageSummary);
            }
        };
        compiler.processWorkspace();
        saveState();

        console.log('writing lastState...');
        writeFile(`test/artifacts/ProjectTest/${test.projName}/lastState.txt`, pkgStates[pkgStates.length - 1].getSummary());
        //printState();

        const genCsharp = new CsharpGenerator().generate(compiler.projectPkg);
        for (const file of genCsharp)
            writeFile(`test/artifacts/ProjectTest/${test.projName}/CSharp/${file.path.replace(".ts", ".cs")}`, file.content);

        const genPython = new PythonGenerator().generate(compiler.projectPkg);
        for (const file of genPython)
            writeFile(`test/artifacts/ProjectTest/${test.projName}/Python/${file.path.replace(".ts", ".py")}`, file.content);
        console.log("DONE.");
        // return;
        // debugger;

        // printState();

        // const lastState = new Linq(pkgStates).last();
        // // if (compiler.workspace.errorManager.errors.length > 0)
        // //     debugger;

        // //head("SUMMARY");
        // //_(pkgStates).last().diff(pkgStates[pkgStates.length - 2]).printChangedFiles("summary");
        // head("FULL");
        // const allChanges = lastState.diff(pkgStates[0]).getChanges("full");
        // console.log(allChanges);

        // //writeFile(`test/artifacts/ProjectTest/${test.projName}/allChanges.txt`, allChanges);

        // debugger;
    }
})
