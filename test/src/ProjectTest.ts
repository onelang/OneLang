import 'module-alias/register';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { readDir, baseDir, writeFile } from "./Utils/TestUtils";
import { ProjectGenerator } from "@one/Generator/ProjectGenerator";
import { Compiler, ICompilerHooks } from "@one/One/Compiler";
import { JsonSerializer } from "@one/One/Serialization/JsonSerializer";
import { PackageStateCapture } from "@one/Test/PackageStateCapture";
import { CompilerHelper } from '@one/One/CompilerHelper';
import { Reflection } from 'One.Reflect-v0.1';
import { TestRunner } from "@one/Test/TestRunner";
import { CrossCompiledTestRunner } from './CrossCompiledTestRunner';

class StateHandler implements ICompilerHooks {
    stage = 0;

    constructor(public compiler: Compiler) { }

    getState() { return new PackageStateCapture(this.compiler.projectPkg); }

    afterStage(stageName: string): void {
        const state = this.getState();
        const stageFn = `test/artifacts/ProjectTest/${this.compiler.projectPkg.name}/stages/${this.stage++}_${stageName}.txt`;
        const stageSummary = state.getSummary();

        console.log(`writing file... ${stageFn}`);
        writeFile(stageFn, stageSummary);
    }
}

function generateReflection(projName: string, compiler: Compiler) {
    const pkgType = compiler.projectPkg.files["One/Ast/Types.ts"].classes.find(x => x.name === "Package").type;
    //Reflection.registerClass(Package, pkgType);
    const serializer = new JsonSerializer(Object.values(compiler.projectPkg.files)[0].literalTypes);
    const projJson = serializer.serialize(Reflection.wrap(compiler.projectPkg, pkgType));
    writeFile(`test/artifacts/ProjectTest/${projName}/ast.json`, projJson);
}

async function compileProject(projDir: string) {
    const projGen = new ProjectGenerator(baseDir, projDir);

    const compiler = await CompilerHelper.initProject(projGen.projectFile.name, projGen.srcDir, projGen.projectFile.sourceLang, null);
    const stateHandler = new StateHandler(compiler);
    compiler.hooks = stateHandler;
    compiler.processWorkspace();

    console.log('writing lastState...');
    writeFile(`test/artifacts/ProjectTest/${projGen.projectFile.name}/lastState.txt`, stateHandler.getState().getSummary());

    await projGen.generate();
}

async function compileTests() {
    const testsDir = "test/testSuites/ProjectTest";
    for (const projName of readDir(testsDir))
        await compileProject(`${testsDir}/${projName}`);
}

CompilerHelper.baseDir = `${baseDir}/`;
//compileTests().then(() => console.log("DONE (Tests)."));
compileProject(`${baseDir}/xcompiled-src`).then(() => {
    console.log("DONE (OneLang compilation).");
    new CrossCompiledTestRunner().run();
});
