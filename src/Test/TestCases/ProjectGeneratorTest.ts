import { One } from "One.Core-v0.1";

// @python-import-all onelang_file
// @php-use OneLang\File\OneFile
import { OneFile } from "One.File-v0.1";

import { ITestCollection, TestCase } from "../TestCase";
import { CompilerHelper } from "../../One/CompilerHelper";
import { Compiler, ICompilerHooks } from "../../One/Compiler";
import { PackageStateCapture } from "../PackageStateCapture";
import { ProjectGenerator } from "../../Generator/ProjectGenerator";

export class StageExporter implements ICompilerHooks {
    stage = 0;

    constructor(public artifactDir: string, public compiler: Compiler) { }

    afterStage(stageName: string): void {
        OneFile.writeText(`${this.artifactDir}/stages/${this.stage++}_${stageName}.txt`, new PackageStateCapture(this.compiler.projectPkg).getSummary());
    }
}

export class ProjectGeneratorTest implements ITestCollection {
    name: string = "ProjectGeneratorTest";

    constructor(public baseDir: string) { }

    getTestCases(): TestCase[] {
        return [new TestCase("OneLang", artifactDir => this.compileOneLang(artifactDir))];
    }

    async compileOneLang(artifactDir: string): Promise<void> {
        const projGen = new ProjectGenerator(this.baseDir, `${this.baseDir}/xcompiled-src`);
        projGen.outDir = `${artifactDir}/output/`;
        const compiler = await CompilerHelper.initProject(projGen.projectFile.name, projGen.srcDir, projGen.projectFile.sourceLang, null);
        compiler.hooks = new StageExporter(artifactDir, compiler);
        compiler.processWorkspace();
        await projGen.generate();
    }
}