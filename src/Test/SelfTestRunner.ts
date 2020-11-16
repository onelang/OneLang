// @python-import-all OneFile
// @php-use onepkg\OneFile\OneFile
import { OneFile } from "One.File-v0.1";
import { CompilerHelper } from "../One/CompilerHelper";
import { IGenerator } from "../Generator/IGenerator";
import { Compiler, ICompilerHooks } from "../One/Compiler";
import { PackageStateCapture } from "./PackageStateCapture";

class CompilerHooks implements ICompilerHooks {
    stage = 0;
    constructor(public compiler: Compiler, public baseDir: string) { }

    afterStage(stageName: string): void {
        const state = new PackageStateCapture(this.compiler.projectPkg);
        const stageFn = `${this.baseDir}/test/artifacts/ProjectTest/OneLang/stages/${this.stage}_${stageName}.txt`;
        this.stage++;
        const stageSummary = state.getSummary();
        const expected = OneFile.readText(stageFn);
        if (stageSummary !== expected) {
            OneFile.writeText(stageFn + "_diff.txt",  stageSummary);
            throw new Error(`Stage result differs from expected: ${stageName} -> ${stageFn}`);
        } else {
            console.log(`[+] Stage passed: ${stageName}`);
        }
    }
}

export class SelfTestRunner {
    constructor(public baseDir: string) {
        CompilerHelper.baseDir = baseDir;
    }

    public async runTest(generator: IGenerator): Promise<boolean> {
        console.log("[-] SelfTestRunner :: START");
        const compiler = await CompilerHelper.initProject("OneLang", `${this.baseDir}src/`);
        compiler.hooks = new CompilerHooks(compiler, this.baseDir);
        compiler.processWorkspace();
        const generated = generator.generate(compiler.projectPkg);
        
        const langName = generator.getLangName();
        const ext = `.${generator.getExtension()}`;

        let allMatch = true;
        for (const genFile of generated) {
            const projBase = `${this.baseDir}test/artifacts/ProjectTest/OneLang`;
            const tsGenPath = `${this.baseDir}/xcompiled/${langName}/${genFile.path}`;
            const reGenPath = `${projBase}/${langName}_Regen/${genFile.path}`;
            const tsGenContent = OneFile.readText(tsGenPath);
            const reGenContent = genFile.content;

            if (tsGenContent != reGenContent) {
                OneFile.writeText(reGenPath, genFile.content);
                console.error(`Content does not match: ${genFile.path}`);
                allMatch = false;
            } else {
                console.log(`[+] Content matches: ${genFile.path}`);
            }
        }

        console.log(allMatch ? "[+} SUCCESS! All generated files are the same" : "[!] FAIL! Not all files are the same");
        console.log("[-] SelfTestRunner :: DONE");
        return allMatch;
    }
}