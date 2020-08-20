import { CsharpGenerator } from "../Generator/CsharpGenerator";
import { Compiler } from "../One/Compiler";

export class SelfTestRunner {
    constructor(public baseDir: string) { }

    async runTest(): Promise<void> {
        const compiler = new Compiler();
        await compiler.init(`${this.baseDir}packages/`);
        //compiler.setupNativeResolver(File.ReadAllText(`${this.baseDir}langs/NativeResolvers/typescript.ts`));
        compiler.newWorkspace();
        compiler.addOverlayPackage("js-yaml");

        var projDir = `${this.baseDir}src/`;
        //for (const file in glob.sync(projDir, "*.ts"))
        //    compiler.addProjectFile(file.Replace(projDir, ""), File.ReadAllText(file));

        //processWorkspace(compiler.workspace, compiler.projectPkg);
        compiler.processWorkspace();
        var genCsharp = new CsharpGenerator().generate(compiler.projectPkg);
    }
}