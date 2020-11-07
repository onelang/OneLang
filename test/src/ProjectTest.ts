import 'module-alias/register';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { glob, readDir, baseDir, writeFile } from "./TestUtils";
import { CsharpGenerator } from "@one/Generator/CsharpGenerator";
import { PythonGenerator } from "@one/Generator/PythonGenerator";
import { PhpGenerator } from "@one/Generator/PhpGenerator";
import { JavaGenerator } from "@one/Generator/JavaGenerator";
import { Compiler, ICompilerHooks } from "@one/One/Compiler";
import { StatementDebugger } from "@one/Utils/StatementDebugger";
import { PackageStateCapture } from "@one/Test/PackageStateCapture";
import { CircularDependencyDetector, DetectionMode } from "@one/One/IssueDetectors/CircularDependencyDetector";
import * as color from "ansi-colors";
import { CompilerHelper } from '@one/One/CompilerHelper';

function head(text: string) { 
    const x = "~".repeat(text.length+4);
    console.log(color.bgRed(` ~~~~~~~~${x}~~~~~~~~ \n ~~~~~~~~  ${text}  ~~~~~~~~ \n ~~~~~~~~${x}~~~~~~~~ `));
}

class StateHandler implements ICompilerHooks {
    stage = 0;
    pkgStates: PackageStateCapture[] = [];

    get lastState() { return this.pkgStates[this.pkgStates.length - 1]; }

    constructor(public compiler: Compiler) { }

    saveState() {
        const state = new PackageStateCapture(this.compiler.projectPkg);
        this.pkgStates.push(state);
        return state;
    }

    afterStage(stageName: string): void {
        const state = this.saveState();
        const stageFn = `test/artifacts/ProjectTest/${this.compiler.projectPkg.name}/stages/${this.stage++}_${stageName}.txt`;
        const stageSummary = state.getSummary();
        console.log(`writing file... ${stageFn}`);
        writeFile(stageFn, stageSummary);
    }
}

async function compileProject(projName: string, projDir: string) {
    const compiler = await CompilerHelper.initProject(projName, projDir, "ts", null);
    const stateHandler = new StateHandler(compiler);
    compiler.hooks = stateHandler;
    compiler.processWorkspace();

    stateHandler.saveState();
    console.log('writing lastState...');
    writeFile(`test/artifacts/ProjectTest/${projName}/lastState.txt`, stateHandler.lastState.getSummary());

    //new StatementDebugger("new .T.C:InterfaceType").visitPackage(compiler.projectPkg);
    //new CircularDependencyDetector(DetectionMode.AllImports).processPackage(compiler.projectPkg);

    for (const generator of [new CsharpGenerator(), new PythonGenerator(), new PhpGenerator(), new JavaGenerator()]) {
        const langName = generator.getLangName();
        const ext = generator.getExtension();
        
        console.log(`Generating ${langName} code...`);
        const files = generator.generate(compiler.projectPkg);
        for (const file of files)
            writeFile(`test/artifacts/ProjectTest/${projName}/${langName}/${file.path.replace(".ts", `.${ext}`)}`, file.content);
    }
}

async function compileTests() {
    const testsDir = "test/testSuites/ProjectTest";
    for (const projName of readDir(testsDir))
        await compileProject(projName, `${testsDir}/${projName}/src`);

    await compileProject("OneLang", `${baseDir}/src`);
}

CompilerHelper.baseDir = `${baseDir}/`;
//compileTests().then(() => console.log("DONE (Tests)."));
compileProject("OneLang", `${baseDir}/src`).then(() => console.log("DONE (OneLang compilation)."));
